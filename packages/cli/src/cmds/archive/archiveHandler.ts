import { exec, execFile } from 'child_process';
import { basename, dirname, isAbsolute, join, normalize, resolve, sep } from 'path';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../lib/locateAppMapDir';
import { exists, findFiles, verbose } from '../../utils';
import { copyFile, link, mkdir, mkdtemp, readFile, rm, unlink, writeFile } from 'fs/promises';
import loadAppMapConfig, { AppMapConfig } from '../../lib/loadAppMapConfig';
import { VERSION as IndexVersion } from '../../fingerprint/fingerprinter';
import chalk from 'chalk';
import gitRevision from './gitRevision';
import { ArchiveMetadata } from '../../lib/ArchiveMetadata';
import analyze from './analyze';
import parseFilterArgs from './parseFilterArgs';
import { cpus, tmpdir } from 'os';
import { log, warn } from 'console';
import buildWorkerPool from './buildWorkerPool';
import { index } from '.';
import { existsSync } from 'fs';
import generateOpenAPI from './generateOpenAPI';
import { ArchiveVersion, PackageVersion } from './archive';
import optionList from '../../lib/optionList';

export default async function handler(argv: any) {
  let finalizers: Promise<unknown>[] = [];

  verbose(argv.verbose);

  if (!process.env.npm_package_version)
    console.log(
      `Note: The AppMap archive won't contain the version of @appland/appmap because process.env.npm_package_version is not available.`
    );

  const {
    maxSize,
    analyze: doAnalyze,
    type: typeArg,
    revision: revisionArg,
    outputFile: outputFileNameArg,
    outputDir: outputDirArg,
    filter: filterArg,
    threadCount: threadCountArg,
    appmapDir: appmapDirArg,
  } = argv;
  // The handler is also called directly, without yargs defaults, so only an
  // explicit false selects --no-in-place.
  const inPlace = argv.inPlace !== false;
  const expand = optionList(argv.expand);

  handleWorkingDirectory(argv.directory);
  const workingDirectory = process.cwd();

  const loadedConfig = await loadAppMapConfig();
  if (!loadedConfig && !appmapDirArg) throw new Error(`Unable to load appmap.yml config file`);
  const appmapConfig: AppMapConfig = loadedConfig || {
    name: basename(workingDirectory),
    appmap_dir: appmapDirArg,
    packages: [],
  };

  if (appmapDirArg && !(await exists(appmapDirArg)))
    throw new Error(`AppMap directory ${appmapDirArg} does not exist`);
  const sourceAppMapDir: string = appmapDirArg || (await locateAppMapDir());

  // With --no-in-place, the archive is built in a scratch copy, so nothing is
  // written beside the recordings. See makeScratchCopy.
  const scratch = inPlace ? undefined : await makeScratchCopy(workingDirectory, sourceAppMapDir);
  const appMapDir = scratch ? scratch.appMapDir : sourceAppMapDir;

  try {
    await buildArchive();
  } finally {
    if (scratch) {
      process.chdir(workingDirectory);
      await rm(scratch.root, { recursive: true, force: true });
    }
  }

  async function buildArchive() {
    const threadCount = threadCountArg || cpus().length;

    const compareConfig = appmapConfig.compare;
    const compareFilter = compareConfig?.filter || {};

    if (filterArg)
      parseFilterArgs(compareFilter, typeof filterArg === 'string' ? [filterArg] : filterArg);

    const maxAppMapSizeInBytes = Math.round(parseFloat(maxSize) * 1024 * 1024);

    console.log(`Building '${typeArg}' archive from ${sourceAppMapDir}`);

    const revision = revisionArg !== undefined ? revisionArg : await gitRevision();
    // The revision is read from git in the real working directory. From here on,
    // a scratch copy is worked on from its own root.
    if (scratch) process.chdir(scratch.root);

    console.log(`Building archive of revision ${revision}`);
    const versions = { archive: ArchiveVersion, index: IndexVersion };
    if (PackageVersion.version) versions[PackageVersion.name] = PackageVersion.version;

    const failedTests = new Set<string>();
    const oversizedAppMaps = new Set<string>();
    if (doAnalyze) {
      warn(`Analyzing AppMaps using ${threadCount} worker threads`);

      const workerPool = buildWorkerPool(threadCount);
      // Index all AppMaps first, so that we can determine which AppMaps are failed tests.
      // If there are test failures, perform a limited analysis that only includes sequence diagrams
      // of the failed tests. Otherwise, perform a full analysis.
      //
      // Scanner findings are not meaningful for failed tests, so we skip doing that
      // work and avoid misleading or confusing the user.
      try {
        await index(workerPool, maxAppMapSizeInBytes, appMapDir, oversizedAppMaps, failedTests);

        let doScan = true;
        if (failedTests.size > 0) {
          warn(
            `${failedTests.size} AppMaps are failed tests. Analysis which depends on all tests passing will be skipped.`
          );
          doScan = false;
        } else {
          log(`No AppMaps are failed tests, so all AppMaps will be analyzed.`);
        }
        await analyze(
          workerPool,
          maxAppMapSizeInBytes,
          compareFilter,
          appMapDir,
          oversizedAppMaps,
          doScan,
          expand
        );
      } finally {
        finalizers.push(workerPool.close());
      }
    } else {
      await generateOpenAPI(appMapDir, maxAppMapSizeInBytes);
    }

    process.chdir(appMapDir);

    const metadata: ArchiveMetadata = {
      versions,
      workingDirectory,
      appMapDir,
      commandArguments: argv,
      revision,
      timestamp: Date.now().toString(),
      failedTests: [...failedTests].sort(),
      oversizedAppMaps: [...oversizedAppMaps].sort(),
      config: appmapConfig,
    };

    let type: string;
    if (await exists('appmap_archive.json')) {
      const existingMetadata = JSON.parse(await readFile('appmap_archive.json', 'utf8'));
      const { revision: baseRevision } = existingMetadata;
      if (typeArg === 'auto') {
        console.log(
          `The AppMap directory contains appmap_archive.json, so the archive type will be 'incremental'.
The base revision is ${baseRevision}.`
        );
      }

      if (typeArg === 'full') {
        console.warn(
          chalk.yellow(
            `\nThe AppMap directory contains appmap_archive.json, so it looks like the directory contains incremental AppMaps
that build on revision ${baseRevision}. However, you've specified --type=full. You should
remove appmap_archive.json if your intention is to build a full archive. Otherwise, use --type=auto or --type=incremental.\n`
          )
        );
        type = 'full';
      } else {
        metadata.baseRevision = baseRevision;
        type = 'incremental';
      }
    } else {
      if (typeArg === 'auto') {
        console.log(
          `The AppMap directory does not contain appmap_archive.json, so the archive type will be 'full'.`
        );
      } else if (typeArg === 'incremental') {
        throw new Error(
          `AppMap directory does not contain appmap_archive.json, but you've specified --type=incremental.
The base revision cannot be determined, so either use --type=auto or --type=full.`
        );
      }
      type = 'full';
    }

    await new Promise<void>((resolveCB, rejectCB) => {
      exec(
        `tar czf appmaps.tar.gz --exclude openapi.yml --exclude appmaps.tar.gz --exclude appmap_archive.json *`,
        (error) => {
          if (error) return rejectCB(error);

          resolveCB();
        }
      );
    });

    // A scratch copy is removed with everything in it. Registering this for one would
    // delete appmaps.tar.gz from whatever the working directory is at exit.
    if (inPlace) process.on('exit', () => unlink('appmaps.tar.gz'));

    await writeFile('appmap_archive.json', JSON.stringify(metadata, null, 2));

    const outputFileName = outputFileNameArg || `${revision}.tar`;

    const defaultOutputDir = () => join('.appmap', 'archive', type);
    const outputDir = outputDirArg || defaultOutputDir();
    const outputPath = archiveOutputPath(workingDirectory, outputDir, outputFileName);
    await mkdir(
      isAbsolute(outputFileName) ? dirname(outputPath) : resolve(workingDirectory, outputDir),
      { recursive: true }
    );

    {
      const tarArgs = ['cf', outputPath, 'appmap_archive.json', 'appmaps.tar.gz'];
      if (existsSync('openapi.yml')) tarArgs.push('openapi.yml');

      await new Promise<void>((resolveCB, rejectCB) => {
        execFile('tar', tarArgs, (error) => {
          if (error) return rejectCB(error);

          resolveCB();
        });
      });
    }
    console.log(
      `Created AppMap archive ${
        isAbsolute(outputFileName) ? outputFileName : join(outputDir, outputFileName)
      }`
    );
    await Promise.all(finalizers);
  }
}

// An absolute --output-file is used as given. Any other value is placed in the
// output directory, as it always has been.
export function archiveOutputPath(
  workingDirectory: string,
  outputDir: string,
  outputFileName: string
): string {
  if (isAbsolute(outputFileName)) return outputFileName;

  return join(resolve(workingDirectory, outputDir), outputFileName);
}

type ScratchCopy = {
  // Temporary directory that stands in for the working directory.
  root: string;
  // The AppMap directory, relative to root.
  appMapDir: string;
};

// Lays out a scratch copy of the AppMap directory, for --no-in-place.
//
// The copy keeps the AppMap directory's relative name: tmp/appmap is copied to
// <root>/tmp/appmap, and the archive is then built with <root> as the working
// directory. So every path that indexing and scanning record (failedTests,
// oversizedAppMaps, the findings, appMapDir in appmap_archive.json) is the same
// string that an in-place archive records. Nothing has to be rewritten.
//
// An AppMap directory given as an absolute path, or outside the working
// directory, has no relative name to keep, so it is placed under its own base
// name, and the archive records paths relative to that name.
async function makeScratchCopy(workingDirectory: string, appMapDir: string): Promise<ScratchCopy> {
  const root = await mkdtemp(join(tmpdir(), 'appmap-archive-'));
  const relativeName = normalize(appMapDir);
  const keepsName =
    !isAbsolute(appMapDir) && relativeName !== '..' && !relativeName.startsWith(`..${sep}`);
  const scratchAppMapDir = keepsName
    ? appMapDir
    : basename(resolve(workingDirectory, appMapDir)) || 'appmaps';

  await linkAppMaps(resolve(workingDirectory, appMapDir), join(root, scratchAppMapDir));

  // The scanner reads appmap-scanner.yml from the working directory.
  const scannerConfig = join(workingDirectory, 'appmap-scanner.yml');
  if (await exists(scannerConfig)) await copyFile(scannerConfig, join(root, 'appmap-scanner.yml'));

  return { root, appMapDir: scratchAppMapDir };
}

// Puts each AppMap file into the scratch directory as a hard link. Archiving only
// reads AppMap files (the index, sequence diagrams and findings are written to new
// files beside them), so a link costs no time or space and the original is never
// written. Where a link can't be made, for example across file systems, the file is
// copied instead.
//
// appmap_archive.json, which marks the directory as holding incremental AppMaps, is
// copied, never linked, because archive overwrites it.
//
// Like the 'tar *' that packs an in-place archive, top-level entries whose names
// start with '.' are skipped; hidden entries further down are kept. Index files from
// an earlier in-place run are not copied.
async function linkAppMaps(fromDir: string, toDir: string) {
  const isHidden = (path: string) => path.split(sep)[0].startsWith('.');
  await mkdir(toDir, { recursive: true });

  for (const file of await findFiles(fromDir, '.appmap.json')) {
    const relativePath = file.slice(fromDir.length + 1);
    if (isHidden(relativePath)) continue;

    const target = join(toDir, relativePath);
    await mkdir(dirname(target), { recursive: true });
    try {
      await link(file, target);
    } catch {
      await copyFile(file, target);
    }
  }

  const archiveMetadata = join(fromDir, 'appmap_archive.json');
  if (await exists(archiveMetadata))
    await copyFile(archiveMetadata, join(toDir, 'appmap_archive.json'));
}
