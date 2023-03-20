import { ClassMap, Metadata } from '@appland/models';
import {
  Diagram as SequenceDiagram,
  format,
  FormatType,
  unparseDiagram,
} from '@appland/sequence-diagram';
import assert from 'assert';
import { queue } from 'async';
import { createHash } from 'crypto';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { glob } from 'glob';
import { dirname, isAbsolute, join, relative, resolve } from 'path';
import { promisify } from 'util';
import { executeCommand } from '../../lib/executeCommand';
import { DiffDiagrams } from '../../sequenceDiagramDiff/DiffDiagrams';
import { ChangedAppMap, ChangeReport } from './ChangeReport';
import { RevisionName } from './RevisionName';
import { mutedStyle } from './ui';

// AppMap file path, without the .appmap.json extension.
type AppMapName = string;
// hex digest of an AppMap's canonical sequence diagram.
type AppMapDigest = string;

async function loadSequenceDiagram(path: string): Promise<SequenceDiagram> {
  const diagramData = JSON.parse(await readFile(path, 'utf-8'));
  return unparseDiagram(diagramData);
}

class SequenceDiagramDigest {
  constructor(
    public appmapData: AppMapData,
    public revisionName: RevisionName,
    public appmap: string
  ) {}

  async digest() {
    const digest = createHash('sha256');
    const diagram = await loadSequenceDiagram(
      this.appmapData.sequenceDiagramPath(this.revisionName, this.appmap)
    );
    diagram.rootActions.forEach((action) => digest.update(action.subtreeDigest));
    return digest.digest('hex');
  }
}

class AppMapIndex {
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

      this.appmapsByDigest[revisionName].get(digest).add(appmap);
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

class AppMapData {
  constructor(public workingDir: string) {}

  async appmaps(revisionName: RevisionName): Promise<AppMapName[]> {
    const sequenceDiagramPaths = await promisify(glob)(
      join(this.workingDir, revisionName, '**/sequence.json')
    );
    return sequenceDiagramPaths.map((path) =>
      relative(join(this.workingDir, revisionName), dirname(path))
    );
  }

  appmapPath(revisionName: RevisionName, appmap: string) {
    return join(this.workingDir, revisionName, appmap);
  }

  metadataPath(revisionName: RevisionName, appmap: string): string {
    return join(this.workingDir, revisionName, appmap, 'metadata.json');
  }

  classMapPath(revisionName: RevisionName, appmap: string): string {
    return join(this.workingDir, revisionName, appmap, 'classMap.json');
  }

  sequenceDiagramPath(revisionName: RevisionName, appmap: string): string {
    return join(this.workingDir, revisionName, appmap, 'sequence.json');
  }

  sequenceDiagramDiffPath(appmap: string): string {
    return join(this.workingDir, RevisionName.Diff, [appmap, 'diff.sequence.json'].join('.'));
  }

  async appmapDir() {}

  async deleteUnchangedAppMaps() {}
}

export default async function buildChangeReport(
  baseRevision: string,
  headRevision: string,
  workingDir: string
): Promise<ChangeReport> {
  const diffDiagrams = new DiffDiagrams();

  const appmapData = new AppMapData(workingDir);
  const appmapIndex = new AppMapIndex(appmapData);
  await appmapIndex.build();
  assert(appmapIndex.addedDigests);
  assert(appmapIndex.removedDigests);

  async function deleteUnchangedAppMaps() {
    assert(appmapIndex.unchangedDigests);

    const deleteAppMap = async (revisionName: RevisionName, appmap: AppMapName) => {
      console.log(mutedStyle(`AppMap ${revisionName}/${appmap} is unchanged.`));
      const path = appmapData.appmapPath(revisionName, appmap);
      await rm(path, { recursive: true });
      await rm([path, 'appmap.json'].join('.'));
    };

    for (const digest of appmapIndex.unchangedDigests) {
      for (const appmap of appmapIndex.appmapsByDigest[RevisionName.Base].get(digest) || []) {
        deleteAppMap(RevisionName.Base, appmap);
      }
      for (const appmap of appmapIndex.appmapsByDigest[RevisionName.Head].get(digest) || []) {
        deleteAppMap(RevisionName.Head, appmap);
      }
    }
  }

  await deleteUnchangedAppMaps();

  const existingAppMaps = new Set(await appmapData.appmaps(RevisionName.Base));
  const newAppMaps = (await appmapData.appmaps(RevisionName.Head)).filter(
    (appmap) => !existingAppMaps.has(appmap)
  );
  const changedAppMaps = (await appmapData.appmaps(RevisionName.Head))
    .filter((appmap) => existingAppMaps.has(appmap))
    .map((appmap) => ({ appmap }));

  {
    const changedQueue = queue(async (changedAppMap: ChangedAppMap) => {
      const { appmap } = changedAppMap;
      const classMapData = JSON.parse(
        await readFile(join(appmapData.classMapPath(RevisionName.Head, appmap)), 'utf-8')
      );
      const classMap = new ClassMap(classMapData);

      const sourcePaths = new Array<string>();
      classMap.visit((codeObject) => {
        if (!codeObject.location) return;

        const path = codeObject.location.split(':')[0];
        if (path.indexOf('.') && !path.startsWith('<') && !isAbsolute(path)) sourcePaths.push(path);
      });

      const sourceDiff = await executeCommand(
        `git diff ${baseRevision}..${headRevision} -- ${[...sourcePaths].sort().join(' ')}`,
        false,
        false,
        false
      );
      if (sourceDiff) changedAppMap.sourceDiff = sourceDiff;

      const baseDiagram = await loadSequenceDiagram(
        appmapData.sequenceDiagramPath(RevisionName.Base, appmap)
      );
      const headDiagram = await loadSequenceDiagram(
        appmapData.sequenceDiagramPath(RevisionName.Head, appmap)
      );
      const diagramDiff = diffDiagrams.diff(baseDiagram, headDiagram);
      if (diagramDiff) {
        const diagramJSON = format(FormatType.JSON, diagramDiff, 'diff');
        const path = appmapData.sequenceDiagramDiffPath(appmap);
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, diagramJSON.diagram);
        changedAppMap.sequenceDiagramDiff = relative(workingDir, path);
      }
    }, 5);
    changedQueue.error(console.warn);
    changedAppMaps.forEach((appmap) => changedQueue.push(appmap));
    if (changedQueue.length()) await changedQueue.drain();
  }

  const failedAppMaps = new Array<{ appmap: AppMapName; metadata: Metadata }>();
  {
    const failedQueue = queue(async (appmap: string) => {
      const metadata = JSON.parse(
        await readFile(join(appmapData.metadataPath(RevisionName.Head, appmap)), 'utf-8')
      ) as Metadata;
      if (metadata.test_status === 'failed') {
        failedAppMaps.push({ appmap, metadata });
      }
    }, 5);
    failedQueue.error(console.warn);
    (await appmapData.appmaps(RevisionName.Head)).forEach((appmap) => failedQueue.push(appmap));
    if (failedQueue.length()) await failedQueue.drain();
  }

  const testFailures = failedAppMaps.map(({ appmap, metadata }) => {
    const testFailure = {
      appmap,
      name: metadata.name,
    } as TestFailure;
    if (metadata.source_location)
      testFailure.testLocation = relative(process.cwd(), metadata.source_location);
    return testFailure;
  });

  return {
    testFailures,
    newAppMaps,
    changedAppMaps,
  };
}
