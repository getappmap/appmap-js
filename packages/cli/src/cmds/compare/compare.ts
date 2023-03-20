import yargs from 'yargs';
import readline from 'readline';

import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { join } from 'path';
import { RevisionName } from './RevisionName';
import { checkout } from './checkout';
import detectRevisions from './detectRevisions';
import { prepareOutputDir } from './prepareOutputDir';
import { verbose } from '../../utils';
import { restore } from './restore';
import buildChangeReport from './buildChangeReport';
import { writeFile } from 'fs/promises';

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
      'directory in which to save the report files. Default is ./change-report/<base-revision>-<head-revision>.',
  });
  args.option('clobber-output-dir', {
    describe: 'remove the output directory if it exists',
    type: 'boolean',
    default: false,
  });

  args.option('archive-dir', {
    describe: 'directory in which the archives are stored',
    type: 'string',
    default: '.appmap/archive',
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
    archiveDir,
    directory,
    baseRevision: baseRevisionArg,
    outputDir: outputDirArg,
    headRevision: headRevisionArg,
  } = argv;

  handleWorkingDirectory(directory);

  const { baseRevision, headRevision } = await detectRevisions(baseRevisionArg, headRevisionArg);

  const outputDir = await prepareOutputDir(
    outputDirArg,
    baseRevision,
    headRevision,
    argv.clobberOutputDir,
    rl
  );

  await restore(outputDir, archiveDir, RevisionName.Base, baseRevision);
  await restore(outputDir, archiveDir, RevisionName.Head, headRevision);

  const changeReport = await buildChangeReport(baseRevision, headRevision, outputDir);

  await writeFile(join(outputDir, 'change-report.json'), JSON.stringify(changeReport, null, 2));
  console.log(JSON.stringify(changeReport, null, 2));

  rl.close();
};
