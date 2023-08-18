import yargs from 'yargs';
import readline from 'readline';
import { join } from 'path';
import { writeFile } from 'fs/promises';

import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import detectRevisions from './detectRevisions';
import { prepareOutputDir } from './prepareOutputDir';
import { verbose } from '../../utils';
import loadAppMapConfig from '../../lib/loadAppMapConfig';
import ChangeReporter, { ChangeReportOptions } from './ChangeReporter';

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

  args.option('delete-unreferenced', {
    describe:
      'whether to delete AppMaps from base and head that are unreferenced by the change report',
    default: true,
    alias: 'delete-unchanged',
  });

  args.option('report-removed', {
    describe:
      'whether to report removed findings, such as removed API routes, resolved findings, etc',
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

  const {
    directory,
    sourceDir: srcDir,
    baseRevision: baseRevisionArg,
    outputDir: outputDirArg,
    headRevision: headRevisionArg,
    deleteUnreferenced,
    reportRemoved,
  } = argv;

  try {
    handleWorkingDirectory(directory);
    const appmapConfig = await loadAppMapConfig();
    if (!appmapConfig) throw new Error(`Unable to load appmap.yml config file`);

    const { baseRevision, headRevision } = await detectRevisions(baseRevisionArg, headRevisionArg);

    const outputDir = await prepareOutputDir(
      outputDirArg,
      baseRevision,
      headRevision,
      argv.clobberOutputDir,
      rl
    );

    const changeReporter = new ChangeReporter(baseRevision, headRevision, outputDir, srcDir);
    await changeReporter.initialize();

    const options = new ChangeReportOptions();
    options.reportRemoved = reportRemoved;
    const report = await changeReporter.report(options);

    if (deleteUnreferenced) {
      await changeReporter.deleteUnreferencedAppMaps();
    }

    await writeFile(join(outputDir, 'change-report.json'), JSON.stringify(report, null, 2));
  } finally {
    rl.close();
  }
};
