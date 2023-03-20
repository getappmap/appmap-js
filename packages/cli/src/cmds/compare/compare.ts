import { mkdir, rm } from 'fs/promises';
import yargs from 'yargs';
import readline from 'readline';

import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { exists, verbose } from '../../utils';
import { join } from 'path';
import { executeCommand } from '../../lib/executeCommand';
import { RevisionName } from './RevisionName';
import * as UI from './ui';
import { handler as restore } from '../archive/restore';

export class ValidationError extends Error {}

export const command = 'compare';
export const describe = 'Compare runtime code behavior between base and head revisions';

async function checkout(revisionName: string, revision: string): Promise<void> {
  console.log();
  console.log(UI.actionStyle(`Switching to ${revisionName} revision: ${revision}`));
  await executeCommand(`git checkout ${revision}`, true, true, true);
  console.log();
}

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

  handleWorkingDirectory(argv.directory);

  const { baseRevision, outputDir: outputDirArg, headRevision: headRevisionArg } = argv;

  let headRevision = headRevisionArg;
  if (!headRevision) {
    let currentBranch = (await executeCommand(`git branch --show-current`)).trim();
    if (currentBranch === '') {
      currentBranch = (await executeCommand(`git show --format=oneline --abbrev-commit`)).split(
        /\s/
      )[0];
    }

    headRevision = currentBranch;
  }

  console.log(UI.prominentStyle(`Current revision is: ${headRevision}`));

  if (baseRevision === headRevision) {
    throw new ValidationError(`Base and head revisions are the same: ${baseRevision}`);
  }

  let outputDir = outputDirArg;
  if (!outputDir) {
    outputDir = `change-report/${UI.sanitizeRevision(baseRevision)}-${UI.sanitizeRevision(
      headRevision
    )}`;
  }

  if (await exists(outputDir)) {
    if (
      argv.clobberOutputDir ||
      !(await UI.confirm(`Use existing data directory ${outputDir}?`, rl))
    ) {
      if (
        !argv.clobberOutputDir &&
        !(await UI.confirm(`Delete existing data directory ${outputDir}?`, rl))
      ) {
        const msg = `The data directory ${outputDir} exists but you don't want to use it or delete it. Aborting...`;
        console.warn(msg);
        yargs.exit(1, new Error(msg));
      }
      await rm(outputDir, { recursive: true, force: true });
      // Rapid rm and then mkdir will silently fail in practice.
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
    }
  }

  await mkdir(outputDir, { recursive: true });
  await mkdir(join(outputDir, RevisionName.Diff), { recursive: true });

  await checkout('base', baseRevision);

  await restore({
    directory: argv.directory,
    revision: baseRevision,
    outputDir: join(outputDir, RevisionName.Base),
    archiveDir: argv.archiveDir,
  });

  await checkout('head', headRevision);

  await restore({
    directory: argv.directory,
    revision: headRevision,
    outputDir: join(outputDir, RevisionName.Head),
    archiveDir: argv.archiveDir,
    exact: true,
  });

  rl.close();
};
