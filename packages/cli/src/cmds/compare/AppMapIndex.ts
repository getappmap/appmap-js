import { queue } from 'async';
import { AppMapData } from './AppMapData';
import { AppMapDigest, AppMapName } from './ChangeReport';
import { RevisionName } from './RevisionName';
import { SequenceDiagramDigest } from './SequenceDiagramDigest';

export class AppMapIndex {
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

  // Digests that are unchanged between the base and head revisions.
  unchangedDigests?: Set<AppMapDigest>;
  // Digests that are new in the head revision.
  addedDigests?: Set<AppMapDigest>;
  // Digests that are removed in the head revision.
  removedDigests?: Set<AppMapDigest>;

  constructor(public appmapData: AppMapData) {}

  async build() {
    const baseAppMaps = await this.appmapData.appmaps(RevisionName.Base);
    const headAppMaps = await this.appmapData.appmaps(RevisionName.Head);
    if (baseAppMaps.length === 0 && headAppMaps.length === 0) return;

    const q = queue(async ({ revisionName, appmap }) => {
      const digest = await new SequenceDiagramDigest(
        this.appmapData,
        revisionName,
        appmap
      ).digest();
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

    this.unchangedDigests = new Set(
      [...this.digests[RevisionName.Base]].filter((digest) =>
        this.digests[RevisionName.Head].has(digest)
      )
    );
    this.addedDigests = new Set(
      [...this.digests[RevisionName.Head]].filter(
        (digest) => !this.digests[RevisionName.Base].has(digest)
      )
    );
    this.removedDigests = new Set(
      [...this.digests[RevisionName.Base]].filter(
        (digest) => !this.digests[RevisionName.Head].has(digest)
      )
    );
  }
}
