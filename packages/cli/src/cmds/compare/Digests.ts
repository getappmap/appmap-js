import { queue } from 'async';
import { Paths } from './Paths';
import { AppMapDigest, AppMapName } from './ChangeReport';
import { RevisionName } from './RevisionName';
import { SequenceDiagramDigest } from './SequenceDiagramDigest';
import { exists } from '../../utils';

export class Digests {
  // All digests for the base and head revisions.
  digests = {
    [RevisionName.Base]: new Set<AppMapDigest>(),
    [RevisionName.Head]: new Set<AppMapDigest>(),
  };
  // Index of AppMap name to digest for both revisions.
  appmapsByDigest = {
    [RevisionName.Base]: new Map<AppMapDigest, Set<AppMapName>>(),
    [RevisionName.Head]: new Map<AppMapDigest, Set<AppMapName>>(),
  };
  // Index of digest to AppMap name for both revisions.
  digestsByAppMap = {
    [RevisionName.Base]: new Map<AppMapName, AppMapDigest>(),
    [RevisionName.Head]: new Map<AppMapName, AppMapDigest>(),
  };

  constructor(public paths: Paths) {}

  async build() {
    const baseAppMaps = await this.paths.appmaps(RevisionName.Base);
    const headAppMaps = await this.paths.appmaps(RevisionName.Head);
    if (baseAppMaps.length === 0 && headAppMaps.length === 0) return;

    const q = queue(async ({ revisionName, appmap }) => {
      if (!(await exists(this.paths.sequenceDiagramPath(revisionName, appmap)))) return;

      const digest = await new SequenceDiagramDigest(this.paths, revisionName, appmap).digest();
      this.digests[revisionName].add(digest);

      if (!this.appmapsByDigest[revisionName].has(digest))
        this.appmapsByDigest[revisionName].set(digest, new Set());
      this.appmapsByDigest[revisionName].get(digest)!.add(appmap);
      this.digestsByAppMap[revisionName].set(appmap, digest);
    }, 5);
    q.error(console.warn);
    baseAppMaps.forEach((appmap) => q.push({ revisionName: RevisionName.Base, appmap }));
    headAppMaps.forEach((appmap) => q.push({ revisionName: RevisionName.Head, appmap }));
    if (q.length()) await q.drain();
  }

  appmapDigest(revisionName: RevisionName, appmap: AppMapName): AppMapDigest {
    return this.digestsByAppMap[revisionName].get(appmap)!;
  }
}
