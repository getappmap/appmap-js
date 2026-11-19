import { readFile } from 'fs/promises';
import { cpus } from 'os';

import { ArchiveMetadata } from '../../lib/ArchiveMetadata';
import { CompareFilter } from '../../lib/loadAppMapConfig';
import { DefaultMaxAppMapSizeInMB } from '../../lib/fileSizeFilter';
import { Paths } from '../../diffArchive/Paths';
import { RevisionName } from '../../diffArchive/RevisionName';
import buildWorkerPool from '../archive/buildWorkerPool';
import { generateSequenceDiagrams } from '../archive/generateSequenceDiagrams';
import parseFilterArgs from '../archive/parseFilterArgs';

// The filter that 'appmap archive' used when it built the stored sequence diagrams:
// compare.filter from appmap.yml, plus any --filter arguments.
export function archiveCompareFilter(metadata: ArchiveMetadata): CompareFilter {
  const filter: CompareFilter = JSON.parse(JSON.stringify(metadata.config?.compare?.filter || {}));
  const filterArgs = metadata.commandArguments?.filter;
  if (filterArgs)
    parseFilterArgs(filter, typeof filterArgs === 'string' ? [filterArgs] : filterArgs);
  return filter;
}

// Rebuilds the sequence.json of every AppMap in base and head with the given
// --expand values, so that the diff diagrams have the same lanes on both sides.
export async function expandSequenceDiagrams(
  paths: Paths,
  expand: string[],
  threadCount?: number
): Promise<void> {
  const workerPool = buildWorkerPool(threadCount || cpus().length);
  try {
    for (const revisionName of [RevisionName.Base, RevisionName.Head]) {
      const metadata = JSON.parse(
        await readFile(paths.manifestPath(revisionName), 'utf-8')
      ) as ArchiveMetadata;
      // Use the size limit the archive was built with, so the same AppMaps are skipped.
      const maxSizeInMB = parseFloat(String(metadata.commandArguments?.maxSize ?? ''));
      const maxAppMapSizeInBytes = Math.round(
        (isNaN(maxSizeInMB) ? DefaultMaxAppMapSizeInMB : maxSizeInMB) * 1024 * 1024
      );

      console.log(`Rebuilding ${revisionName} sequence diagrams with --expand ${expand.join(' ')}`);
      await generateSequenceDiagrams(
        workerPool,
        maxAppMapSizeInBytes,
        archiveCompareFilter(metadata),
        new Set<string>(),
        paths.revisionPath(revisionName),
        expand
      );
    }
  } finally {
    await workerPool.close();
  }
}
