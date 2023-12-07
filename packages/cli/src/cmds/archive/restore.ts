import assert from 'assert';
import { existsSync } from 'fs';
import { glob } from 'glob';
import { basename, join } from 'path';
import { inspect, promisify } from 'util';
import yargs from 'yargs';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { verbose } from '../../utils';
import { ArchiveEntry, ArchiveStore, FileArchiveStore, GitHubArchiveStore } from './archiveStore';
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
    type: 'string',
    alias: 'r',
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

  args.option('check', {
    describe: 'only check to see if the specific revision requested is available to be restored',
    type: 'boolean',
    default: false,
  });

  return args.strict();
};

export const handler = async (argv: any) => {
  verbose(argv.verbose);

  handleWorkingDirectory(argv.directory);

  const {
    revision: revisionArg,
    outputDir: outputDirArg,
    githubRepo,
    archiveDir,
    exact,
    check,
  } = argv;

  const revision = revisionArg !== undefined ? revisionArg.toString() : await gitRevision();
  const outputDir = outputDirArg || join('.appmap', 'work', revision);
  if (existsSync(outputDir)) throw new Error(`Output directory ${outputDir} already exists`);

  console.log(`Restoring AppMaps of revision ${revision} to ${outputDir}`);

  let archiveStore: ArchiveStore;
  if (githubRepo) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error('GITHUB_TOKEN must be set to use the --github-repo option');
    archiveStore = new GitHubArchiveStore(githubRepo, token);
  } else {
    archiveStore = new FileArchiveStore(archiveDir);
  }
  const archivesAvailable = await archiveStore.revisionsAvailable();
  if (verbose()) console.debug(`Found ${inspect(archivesAvailable)} AppMap archives`);

  let ancestors: string[] | undefined;
  let mostRecentArchiveAvailable: ArchiveEntry | undefined = [
    ...archivesAvailable.full.values(),
  ].find((archive) => archive.revision === revision);
  if (mostRecentArchiveAvailable) {
    console.log(`Found exact match full AppMap archive ${revision}`);
    if (check) {
      console.log(`Check option is enabled, not continuing to download.`);
      process.exit(0);
    }
  } else {
    ancestors = await gitAncestors(revision);
    {
      const ancestorIndex = ancestors.reduce(
        (memo, revision, index) => ((memo[revision] = index), memo),
        {} as Record<string, number>
      );
      let mostRecentAncestorIndex: number | undefined;
      for (const archive of archivesAvailable.full.values()) {
        const index = ancestorIndex[archive.revision];
        if (
          index !== undefined &&
          (mostRecentAncestorIndex === undefined || index < mostRecentAncestorIndex)
        ) {
          mostRecentAncestorIndex = index;
          mostRecentArchiveAvailable = archive;
        }
      }
    }
    if (!mostRecentArchiveAvailable)
      throw new Error(`No full AppMap archive found in the ancestry of ${revision}`);
  }

  console.log(`Using revision ${mostRecentArchiveAvailable.revision} as the baseline`);

  const fullArchivePath = await archiveStore.fetch(mostRecentArchiveAvailable.id);

  console.log(
    `Restoring full archive revision '${mostRecentArchiveAvailable.revision}' from '${fullArchivePath}' to '${outputDir}'`
  );

  await unpackArchive(outputDir, fullArchivePath);

  let restoredRevision = mostRecentArchiveAvailable.revision;
  const restoredRevisions = [restoredRevision];

  if (mostRecentArchiveAvailable.revision !== revision) {
    assert(ancestors);
    const baseRevisionIndex = ancestors.indexOf(mostRecentArchiveAvailable.revision);
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

  console.log(`Restore complete`);
};
