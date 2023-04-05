import assert from 'assert';
import { rmdir, unlink } from 'fs/promises';
import { glob } from 'glob';
import { basename, join } from 'path';
import { promisify } from 'util';
import yargs from 'yargs';
import FingerprintDirectoryCommand from '../../fingerprint/fingerprintDirectoryCommand';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { verbose } from '../../utils';
import { ArchiveStore, FileArchiveStore, GitHubArchiveStore } from './archiveStore';
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
    describe: 'directory in which to restore the data. Default: .appmap/work/<revision>',
    type: 'string',
  });

  args.option('archive-dir', {
    describe: 'directory in which the archives are stored',
    type: 'string',
    default: '.appmap/archive',
  });

  args.option('github-repo', {
    describe:
      'Fetch AppMap archives from artifacts on a GitHub repository. GITHUB_TOKEN must be set for this option to work.',
    type: 'string',
  });

  args.option('exact', {
    describe: 'fail unless the specific revision requested is available to be restored',
    type: 'boolean',
    default: false,
  });

  return args.strict();
};

export const handler = async (argv: any) => {
  verbose(argv.verbose);

  handleWorkingDirectory(argv.directory);

  const { revision: revisionArg, outputDir: outputDirArg, githubRepo, archiveDir, exact } = argv;

  const revision = revisionArg || (await gitRevision());
  const outputDir = outputDirArg || join('.appmap', 'work', revision);

  console.log(`Restoring AppMaps of revision ${revision} to ${outputDir}`);

  const ancestors = await gitAncestors(revision);

  let archiveStore: ArchiveStore;
  if (githubRepo) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error('GITHUB_TOKEN must be set to use the --github-repo option');
    archiveStore = new GitHubArchiveStore(githubRepo, token);
  } else {
    archiveStore = new FileArchiveStore(archiveDir);
  }

  const archivesAvailable = await archiveStore.revisionsAvailable();

  const mostRecentRevisionAvailable = ancestors.find((revision) =>
    [...archivesAvailable.full.values()].find((archive) => archive.revision === revision)
  );
  if (!mostRecentRevisionAvailable)
    throw new Error(`No full AppMap archive found in the ancestry of ${revision}`);

  console.log(`Using revision ${mostRecentRevisionAvailable} as the baseline`);

  await rmdir(outputDir, { recursive: true });

  const fullArchivePath = await archiveStore.fetch(mostRecentRevisionAvailable);

  console.log(
    `Restoring full archive revision '${mostRecentRevisionAvailable}' from '${fullArchivePath}'}`
  );

  await unpackArchive(outputDir, fullArchivePath);
  await archiveStore.cleanup(fullArchivePath);

  let restoredRevision = mostRecentRevisionAvailable;
  const restoredRevisions = [restoredRevision];

  if (mostRecentRevisionAvailable !== revision) {
    const baseRevisionIndex = ancestors.indexOf(mostRecentRevisionAvailable);
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
      const incrementalRevision = basename(archive, '.tar');
      restoredRevision = incrementalRevision;
      restoredRevisions.push(restoredRevision);
      await unpackArchive(outputDir, archive);
    }
  }

  if (exact) {
    if (restoredRevisions[restoredRevisions.length - 1] !== revision) {
      throw new Error(
        `Unable to restore specific revision ${revision}; applied ${restoredRevisions.join(', ')}.`
      );
    }
  }

  console.log(`Updating indexes`);

  process.stdout.write(`Indexing AppMaps...`);
  const numIndexed = await new FingerprintDirectoryCommand(outputDir).execute();
  process.stdout.write(`done (${numIndexed})\n`);

  console.log(`Restore complete`);
};
