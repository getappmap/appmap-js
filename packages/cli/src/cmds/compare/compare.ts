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

export const command = 'compare';
export const describe = 'Compare runtime code behavior between base and head revisions';

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

  args.option('delete-unchanged', {
    describe:
      'whether to delete AppMaps from base and head that are unchanged according to sequence diagram comparison',
    default: true,
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
    sourceDir: srcDir,
    baseRevision: baseRevisionArg,
    outputDir: outputDirArg,
    headRevision: headRevisionArg,
    deleteUnchanged,
  } = argv;

  handleWorkingDirectory(directory);
  const appmapConfig = await loadAppMapConfig();
  if (!appmapConfig) throw new Error(`Unable to load appmap.yml config file`);

  let scannerConfig: string | undefined;
  try {
    scannerConfig = await readFile(join(srcDir, 'appmap-scanner.yml'), 'utf-8');
    console.debug(`Using scanner configuration from appmap-scanner.yml`);
  } catch (e) {
    console.debug(`Unable to load appmap-scanner.yml. Will use default scanner configuration.`);
  }

  const { baseRevision, headRevision } = await detectRevisions(baseRevisionArg, headRevisionArg);

  const outputDir = await prepareOutputDir(
    outputDirArg,
    baseRevision,
    headRevision,
    argv.clobberOutputDir,
    rl
  );

  for (const [revisionName, revision] of [
    [RevisionName.Base, baseRevision],
    [RevisionName.Head, headRevision],
  ] as [RevisionName, string][]) {
    // These need to be serialized, because a git checkout is performed.
    await analyzeArchive(revision, join(outputDir, revisionName), scannerConfig);
  }

  const changeReport = await buildChangeReport(
    baseRevision,
    headRevision,
    outputDir,
    srcDir,
    deleteUnchanged
  );

  await writeFile(join(outputDir, 'change-report.json'), JSON.stringify(changeReport, null, 2));

  rl.close();
};
