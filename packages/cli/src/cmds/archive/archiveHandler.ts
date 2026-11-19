import { exec, execFile } from 'child_process';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'path';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../lib/locateAppMapDir';
import { exists, findFiles, verbose } from '../../utils';
import { copyFile, mkdir, mkdtemp, readFile, rm, unlink, writeFile } from 'fs/promises';
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
    inPlace: inPlaceArg,
  } = argv;
  const inPlace = inPlaceArg !== false;

  handleWorkingDirectory(argv.directory);
  const workingDirectory = process.cwd();

  const loadedConfig = await loadAppMapConfig();
  if (!loadedConfig && !appmapDirArg)
    throw new Error(
      `Unable to load appmap.yml config file. Use --appmap-dir to archive without one.`
    );
  const appmapConfig: AppMapConfig = loadedConfig || {
    name: basename(workingDirectory),
    appmap_dir: appmapDirArg,
    packages: [],
  };

  const sourceAppMapDir: string = appmapDirArg || (await locateAppMapDir());
  if (!(await exists(sourceAppMapDir)))
    throw new Error(`AppMap directory ${sourceAppMapDir} does not exist`);

  // Without --in-place, the AppMaps are indexed in a temporary copy, so that
  // the AppMap directory is left as it was.
  let tempDir: string | undefined;
  let appMapDir = sourceAppMapDir;
  if (!inPlace) {
    tempDir = await mkdtemp(join(tmpdir(), 'appmap-archive-'));
    await copyAppMaps(sourceAppMapDir, tempDir);
    appMapDir = tempDir;
  }

  try {
    await buildArchive();
  } finally {
    process.chdir(workingDirectory);
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
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
        // Without --in-place, run statistics go in the temporary copy too, so that
        // nothing is written beside the recordings.
        await index(
          workerPool,
          maxAppMapSizeInBytes,
          appMapDir,
          oversizedAppMaps,
          failedTests,
          tempDir ? join(tempDir, '.appmap', 'run-stats') : undefined
        );

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
          doScan
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
      failedTests: relativeToAppMapDir(failedTests),
      oversizedAppMaps: relativeToAppMapDir(oversizedAppMaps),
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

    const appmapsTarball = resolve('appmaps.tar.gz');
    if (inPlace) process.on('exit', () => unlink(appmapsTarball).catch(() => undefined));

    await writeFile('appmap_archive.json', JSON.stringify(metadata, null, 2));

    const outputPath = resolveOutputPath(
      workingDirectory,
      type,
      revision,
      outputFileNameArg,
      outputDirArg
    );
    await mkdir(dirname(outputPath), { recursive: true });

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
    console.log(`Created AppMap archive ${relative(workingDirectory, outputPath) || outputPath}`);
    await Promise.all(finalizers);
  }

  // Paths of failed and oversized AppMaps are stored relative to the AppMap directory,
  // whether or not the AppMaps were indexed in a temporary copy.
  function relativeToAppMapDir(files: Set<string>): string[] {
    const root = resolve(workingDirectory, appMapDir);
    return [...files].map((file) => relative(root, resolve(workingDirectory, file))).sort();
  }
}

// A bare file name goes in the output directory. A path (absolute, or containing a
// directory) is used as given, relative to the working directory.
export function resolveOutputPath(
  workingDirectory: string,
  type: string,
  revision: string,
  outputFile: string | undefined,
  outputDir: string | undefined
): string {
  if (
    outputFile &&
    (isAbsolute(outputFile) || outputFile.includes('/') || outputFile.includes(sep))
  ) {
    if (outputDir)
      throw new Error(
        `--output-file ${outputFile} includes a directory, so --output-dir cannot also be given`
      );
    return resolve(workingDirectory, outputFile);
  }

  return resolve(
    workingDirectory,
    outputDir || join('.appmap', 'archive', type),
    outputFile || `${revision}.tar`
  );
}

// Copies the AppMap files (and appmap_archive.json, if present) into a scratch directory.
// Index files from an earlier run are not copied. Like the 'tar *' that packs the archive,
// top-level entries whose names start with '.' are skipped; hidden entries further down are kept.
async function copyAppMaps(fromDir: string, toDir: string) {
  const isHidden = (path: string) => path.split(sep)[0].startsWith('.');
  const files = await findFiles(fromDir, '.appmap.json');
  for (const file of files) {
    const relativePath = relative(fromDir, file);
    if (isHidden(relativePath)) continue;

    const target = join(toDir, relativePath);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(file, target);
  }
  const archiveMetadata = join(fromDir, 'appmap_archive.json');
  if (await exists(archiveMetadata))
    await copyFile(archiveMetadata, join(toDir, 'appmap_archive.json'));
}
