import { exec } from 'child_process';
import { join, resolve } from 'path';
import yargs from 'yargs';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../lib/locateAppMapDir';
import { exists, verbose } from '../../utils';
import { mkdir, readFile, stat, unlink, writeFile } from 'fs/promises';
import { DefaultMaxAppMapSizeInMB } from '../../lib/fileSizeFilter';
import loadAppMapConfig from '../../lib/loadAppMapConfig';
import { VERSION as IndexVersion } from '../../fingerprint/fingerprinter';
import chalk from 'chalk';
import gitRevision from './gitRevision';
import { ArchiveMetadata } from './ArchiveMetadata';
import analyze from './analyze';
import parseFilterArgs from './parseFilterArgs';
import { cpus } from 'os';
import { log, warn } from 'console';
import buildWorkerPool from './buildWorkerPool';
import { index } from '.';
import { generateSequenceDiagrams } from './generateSequenceDiagrams';
import { existsSync } from 'fs';

// ## 1.3.0
//
// * AppMap scanner is run on all AppMaps, with an appmap-findings.json file stored in each index directory.
//
// ## 1.2.0
//
// * Update format of compare fliters.
//
// ## 1.1.1
//
// * SQL actions in sequence diagram - digest is a fixed value if the SQL string is truncated.
//
// ## 1.1.0
//
// * Added appMapFilter to the archive metadata.
export const ArchiveVersion = '1.3.0';

export const PackageVersion = {
  name: '@appland/appmap',
  version: process.env.npm_package_version,
};

export const command = 'archive';
export const describe = 'Build an AppMap archive from a directory containing AppMaps';

export const builder = (args: yargs.Argv) => {
  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });

  args.option('type', {
    describe: 'archive type',
    choices: ['full', 'incremental', 'auto'],
    default: 'auto',
    alias: 't',
  });

  args.option('revision', {
    describe: `revision identifier.
    
If not explicitly specified, the current git revision will be used.
When this command is used in an CI server, it's best to explicitly the provide the revision
from an environment variable provided by the CI system, such as GITHUB_HEAD_SHA, because the
commit of the current git revision may not be the one that triggered the build.`,
    type: 'string',
    alias: 'r',
  });

  args.option('output-dir', {
    describe: `directory in which to save the output file. By default, it's .appmap/archive/<type>.`,
    type: 'string',
  });

  args.option('output-file', {
    describe: 'output file name. Default output name is <revision>.tar',
    type: 'string',
    alias: 'f',
  });

  args.option('max-size', {
    describe: 'maximum AppMap size that will be processed, in filesystem-reported MB',
    default: DefaultMaxAppMapSizeInMB,
  });

  args.option('filter', {
    describe: 'filter to apply to AppMaps when normalizing them into sequence diagrams',
    type: 'string',
    multiple: true,
  });

  args.option('thread-count', {
    describe: 'Number of worker threads to use when analyzing AppMaps',
    type: 'number',
  });

  return args.strict();
};

export const handler = async (argv: any) => {
  verbose(argv.verbose);

  if (!process.env.npm_package_version)
    console.log(
      `Note: The AppMap archive won't contain the version of @appland/appmap because process.env.npm_package_version is not available.`
    );

  const {
    maxSize,
    type: typeArg,
    revision: revisionArg,
    outputFile: outputFileNameArg,
    outputDir: outputDirArg,
    filter: filterArg,
    threadCount: threadCountArg,
  } = argv;

  handleWorkingDirectory(argv.directory);
  const workingDirectory = process.cwd();

  const appmapConfig = await loadAppMapConfig();
  if (!appmapConfig) throw new Error(`Unable to load appmap.yml config file`);

  const appMapDir = await locateAppMapDir();

  const threadCount = threadCountArg || cpus().length;

  const compareConfig = appmapConfig.compare;
  const compareFilter = compareConfig?.filter || {};

  if (filterArg)
    parseFilterArgs(compareFilter, typeof filterArg === 'string' ? [filterArg] : filterArg);

  const maxAppMapSizeInBytes = Math.round(parseFloat(maxSize) * 1024 * 1024);

  console.log(`Building '${typeArg}' archive from ${appMapDir}`);

  const revision = revisionArg !== undefined ? revisionArg : await gitRevision();

  console.log(`Building archive of revision ${revision}`);
  const versions = { archive: ArchiveVersion, index: IndexVersion };
  if (PackageVersion.version) versions[PackageVersion.name] = PackageVersion.version;

  const failedTests = new Set<string>();
  const oversizedAppMaps = new Set<string>();
  warn(`Analyzing AppMaps using ${threadCount} worker threads`);

  const workerPool = buildWorkerPool(threadCount);
  // Index all AppMaps first, so that we can determine which AppMaps are failed tests.
  // If there are test failures, perform a limited analysis that only includes sequence diagrams
  // of the failed tests. Otherwise, perform a full analysis.
  //
  // API changes and scanner findings are not meaningful for failed tests, so we skip doing that
  // work and avoid misleading or confusing the user.
  try {
    await index(workerPool, maxAppMapSizeInBytes, appMapDir, oversizedAppMaps, failedTests);

    if (failedTests.size > 0) {
      warn(`${failedTests.size} AppMaps are failed tests. Only these AppMaps will be analyzed.`);
      await generateSequenceDiagrams(
        workerPool,
        maxAppMapSizeInBytes,
        compareFilter,
        oversizedAppMaps,
        undefined,
        [...failedTests].sort()
      );
    } else {
      log(`No AppMaps are failed tests, so all AppMaps will be analyzed.`);
      await analyze(workerPool, maxAppMapSizeInBytes, compareFilter, appMapDir, oversizedAppMaps);
    }
  } finally {
    workerPool.close();
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

  process.on('exit', () => unlink('appmaps.tar.gz'));

  await writeFile('appmap_archive.json', JSON.stringify(metadata, null, 2));

  const outputFileName = outputFileNameArg || `${revision}.tar`;

  const defaultOutputDir = () => join('.appmap', 'archive', type);
  const outputDir = outputDirArg || defaultOutputDir();
  await mkdir(resolve(workingDirectory, outputDir), { recursive: true });

  {
    let tarCommand = `tar cf ${join(
      resolve(workingDirectory, outputDir),
      outputFileName
    )} appmap_archive.json appmaps.tar.gz`;
    if (existsSync('openapi.yml')) tarCommand += ' openapi.yml';

    await new Promise<void>((resolveCB, rejectCB) => {
      exec(tarCommand, (error) => {
        if (error) return rejectCB(error);

        resolveCB();
      });
    });
  }
  console.log(`Created AppMap archive ${join(outputDir, outputFileName)}`);
};
