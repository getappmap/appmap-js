import readline from 'readline';
import { join } from 'path';
import { writeFile } from 'fs/promises';

import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import detectRevisions from './detectRevisions';
import { defaultOutputDir, prepareOutputDir } from './prepareOutputDir';
import { checkArchives, restoreArchives } from './restoreArchives';
import { expandSequenceDiagrams } from './expandSequenceDiagrams';
import { ValidationError } from './ValidationError';
import { Paths } from '../../diffArchive/Paths';
import optionList from '../../lib/optionList';
import { verbose } from '../../utils';
import loadAppMapConfig from '../../lib/loadAppMapConfig';
import { analyzeChanges } from '../../diffArchive/ChangeAnalysis';
import reportChanges, { ChangeReportOptions } from './reportChanges';
import deleteUnreferencedAppMaps from './deleteUnreferencedAppMaps';
import { RevisionName } from '../../diffArchive/RevisionName';

export default async function handler(argv: any) {
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
    baseArchive,
    headArchive,
  } = argv;
  const expand = optionList(argv.expand);

  try {
    handleWorkingDirectory(directory);

    let baseRevision: string;
    let headRevision: string;
    // --expand rebuilds the sequence diagrams in base/ and head/. With archives, compare
    // restores those directories itself. Without them, they belong to the caller, and
    // rewriting them would change what a later compare of the same directories sees.
    if (expand && !baseArchive)
      throw new ValidationError(`--expand can only be used with --base-archive and --head-archive`);

    if (baseArchive || headArchive) {
      if (!baseArchive || !headArchive)
        throw new ValidationError(`--base-archive and --head-archive must be given together`);

      // The revisions default to the ones stored in the archives. They may be the same,
      // for example when both sides were recorded at one commit with different working trees.
      const archives = { [RevisionName.Base]: baseArchive, [RevisionName.Head]: headArchive };
      const manifests = await checkArchives(archives);
      baseRevision = baseRevisionArg ?? manifests.base.revision;
      headRevision = headRevisionArg ?? manifests.head.revision;

      await restoreArchives(
        outputDirArg || defaultOutputDir(baseRevision, headRevision),
        archives,
        argv.clobberOutputDir
      );
    } else {
      if (!baseRevisionArg)
        throw new ValidationError(`--base-revision is required unless --base-archive is given`);

      const appmapConfig = await loadAppMapConfig();
      if (!appmapConfig) throw new Error(`Unable to load appmap.yml config file`);

      ({ baseRevision, headRevision } = await detectRevisions(baseRevisionArg, headRevisionArg));
    }

    const outputDir = await prepareOutputDir(
      outputDirArg,
      baseRevision,
      headRevision,
      argv.clobberOutputDir,
      rl
    );

    const options = new ChangeReportOptions();
    options.reportRemoved = reportRemoved;

    if (expand && expand.length > 0) await expandSequenceDiagrams(new Paths(outputDir), expand);

    const changeAnalysis = await analyzeChanges(outputDir, srcDir, baseRevision, headRevision);
    const report = await reportChanges(changeAnalysis, options);

    if (deleteUnreferenced) {
      const isPathReferenced = (revisionName: RevisionName, appmap: string): boolean =>
        changeAnalysis.referencedAppMaps.test(revisionName, appmap);

      await deleteUnreferencedAppMaps(changeAnalysis.paths, isPathReferenced);
    }

    if (report.warnings) {
      for (const [key, messages] of Object.entries(report.warnings)) {
        for (const message of messages) {
          console.warn(`Warning (${key}): ${message}`);
        }
      }
    }

    await writeFile(join(outputDir, 'change-report.json'), JSON.stringify(report, null, 2));
  } finally {
    rl.close();
  }
}
