import yargs from 'yargs';
import readline from 'readline';

import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { join } from 'path';
import { RevisionName } from './RevisionName';
import detectRevisions from './detectRevisions';
import { prepareOutputDir } from './prepareOutputDir';
import { verbose } from '../../utils';
import buildChangeReport from './buildChangeReport';
import { readFile, writeFile } from 'fs/promises';
import analyzeArchive from './ArchiveAnalyzer';
import loadAppMapConfig from '../../lib/loadAppMapConfig';
import updateSequenceDiagrams, { buildAppMapFilter } from '../archive/updateSequenceDiagrams';
import { DefaultMaxAppMapSizeInMB } from '../../lib/fileSizeFilter';
import { ArchiveMetadata } from '../archive/ArchiveMetadata';
import { serializeAppMapFilter } from '../archive/serializeAppMapFilter';
import { ArchiveVersion } from '../archive/archive';
import { promisify } from 'util';
import { glob } from 'glob';

export const command = 'compare';
export const describe = 'Compare runtime code behavior between base and head revisions';

const jsonEquals = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);

export const builder = (args: yargs.Argv) => {
  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });

  args.option('base-revision', {
    describe: 'base revision name or commit SHA.',
    alias: ['b', 'base'],
    demandOption: true,
  });
  args.option('head-revision', {
    describe: 'head revision name or commit SHA. By default, use the current commit.',
    alias: ['h', 'head'],
  });

  args.option('output-dir', {
    describe:
      'directory in which to save the report files. Default is ./.appmap/change-report/<base-revision>-<head-revision>.',
  });

  args.option('clobber-output-dir', {
    describe: 'remove the output directory if it exists',
    type: 'boolean',
    default: false,
  });

  args.option('source-dir', {
    describe: 'root directory of the application source code',
    type: 'string',
    default: '.',
  });

  args.option('max-size', {
    describe: 'maximum AppMap size that will be processed, in filesystem-reported MB',
    default: DefaultMaxAppMapSizeInMB,
  });

  return args.strict();
};

export const handler = async (argv: any) => {
  verbose(argv.verbose);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.on('close', function () {
    yargs.exit(0, new Error());
  });

  const {
    directory,
    maxSize,
    sourceDir: srcDir,
    baseRevision: baseRevisionArg,
    outputDir: outputDirArg,
    headRevision: headRevisionArg,
  } = argv;

  handleWorkingDirectory(directory);
  const appmapConfig = await loadAppMapConfig();
  if (!appmapConfig) throw new Error(`Unable to load appmap.yml config file`);

  const maxAppMapSizeInBytes = Math.round(parseFloat(maxSize) * 1024 * 1024);

  const { baseRevision, headRevision } = await detectRevisions(baseRevisionArg, headRevisionArg);

  const outputDir = await prepareOutputDir(
    outputDirArg,
    baseRevision,
    headRevision,
    argv.clobberOutputDir,
    rl
  );

  console.log('Generating sequence diagrams');

  const preflightConfig = appmapConfig.preflight;
  const appMapFilter = buildAppMapFilter(preflightConfig?.filter || {});

  for (const revisionName of [RevisionName.Base, RevisionName.Head]) {
    let rebuildBecauseArchiveVersionChanged = false,
      rebuildBecauseFilterChanged = false;

    // For each appmap_archive.json
    for (const appmapArchiveFile of await promisify(glob)(
      join(outputDir, revisionName, 'appmap_archive.*.json')
    )) {
      const archiveMetadata = JSON.parse(
        await readFile(appmapArchiveFile, 'utf-8')
      ) as ArchiveMetadata;
      const archiveAppMapFilter = archiveMetadata.appMapFilter;
      if (archiveMetadata.versions.archive !== ArchiveVersion) {
        rebuildBecauseArchiveVersionChanged = true;
        console.log(
          `Rebuilding ${revisionName} because archive format version ${archiveMetadata.versions.archive} is out of date with current version ${ArchiveVersion}`
        );
        break;
      }

      if (!jsonEquals(serializeAppMapFilter(appMapFilter), archiveAppMapFilter)) {
        rebuildBecauseFilterChanged = true;
        console.log(`Rebuilding ${revisionName} because AppMap filter changed`);
        console.log(`Old filter: ${JSON.stringify(archiveAppMapFilter)}`);
        console.log(`New filter: ${JSON.stringify(serializeAppMapFilter(appMapFilter))}`);
        break;
      }
    }

    const rebuild = rebuildBecauseArchiveVersionChanged || rebuildBecauseFilterChanged;
    if (rebuild) {
      await updateSequenceDiagrams(
        join(outputDir, revisionName),
        maxAppMapSizeInBytes,
        appMapFilter
      );
    }
  }

  for (const [revisionName, revision] of [
    [RevisionName.Base, baseRevision],
    [RevisionName.Head, headRevision],
  ] as [RevisionName, string][]) {
    // These need to be serialized, because a git checkout is performed.
    await analyzeArchive(revision, join(outputDir, revisionName));
  }

  const changeReport = await buildChangeReport(baseRevision, headRevision, outputDir, srcDir);

  await writeFile(join(outputDir, 'change-report.json'), JSON.stringify(changeReport, null, 2));

  rl.close();
};
