import assert from 'assert';
import { rmdir, unlink } from 'fs/promises';
import { glob } from 'glob';
import { basename, join } from 'path';
import { promisify } from 'util';
import yargs from 'yargs';
import FingerprintDirectoryCommand from '../../fingerprint/fingerprintDirectoryCommand';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { verbose } from '../../utils';
import gitAncestors from './gitAncestors';
import gitRevision from './gitRevision';
import unpackArchive from './unpackArchive';

export const command = 'restore';
export const describe = 'Restore the most current available AppMap data from available archives';

export const builder = (args: yargs.Argv) => {
  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });

  args.option('revision', {
    describe: `revision to restore`,
  });

  args.option('output-dir', {
    describe: 'directory in which to restore the data',
    type: 'string',
    demandOption: true,
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

  handleWorkingDirectory(argv.directory);

  const { revision: defaultRevision, outputDir, archiveDir } = argv;

  const revision = await gitRevision(defaultRevision);

  console.log(`Restoring AppMaps of revision ${revision} to ${outputDir}`);

  const ancestors = await gitAncestors();

  // Find the AppMap tarball that's closest in the git ancestry.
  const fullArchivesAvailable = await promisify(glob)(join(archiveDir, 'full', '*.tar'));
  const mostRecentFullArchive = fullArchivesAvailable.find((archive) => {
    const revision = basename(archive, '.tar');
    return ancestors.includes(revision);
  });
  if (!mostRecentFullArchive) throw new Error(`No AppMap tarball found in the ancestry of HEAD`);

  const baseRevision = basename(mostRecentFullArchive, '.tar');

  console.log(`Using revision ${baseRevision} as the baseline`);

  await rmdir(outputDir, { recursive: true });

  console.log(`Restoring full archive ${mostRecentFullArchive}`);
  await unpackArchive(outputDir, mostRecentFullArchive);

  const baseRevisionIndex = ancestors.indexOf(baseRevision);
  assert(baseRevisionIndex !== -1);
  const ancestorsAfterBaseRevision = new Set<string>(ancestors.slice(0, baseRevisionIndex));
  const incrementalArchivesAvailable = (
    await promisify(glob)(join(archiveDir, 'incremental', '*.tar'))
  ).filter((archive) => {
    const revision = basename(archive, '.tar');
    return ancestorsAfterBaseRevision.has(revision);
  });

  console.log(`Applying incremental archives ${incrementalArchivesAvailable.join(', ')}`);

  for (const archive of incrementalArchivesAvailable) {
    await unpackArchive(outputDir, archive);
  }

  console.log(`Updating indexes`);

  process.stdout.write(`Indexing AppMaps...`);
  const numIndexed = await new FingerprintDirectoryCommand(outputDir).execute();
  process.stdout.write(`done (${numIndexed})\n`);

  console.log(`Restore complete`);
};
