import { readFile, rm } from 'fs/promises';
import { join } from 'path';
import { queue } from 'async';
import assert from 'assert';
import { warn } from 'console';

import { Metadata } from '@appland/models';
import { Finding } from '@appland/scanner';

import { ArchiveMetadata } from '../lib/ArchiveMetadata';
import { Paths } from '../diffArchive/Paths';
import { Digests } from '../diffArchive/Digests';
import { RevisionName } from '../diffArchive/RevisionName';
import { exists } from '../utils';
import { AppMapName } from '../cmds/compare/ChangeReport';
import loadFindings from './loadFindings';

export type BaseOrHead = RevisionName.Base | RevisionName.Head;

class ReferencedAppMaps {
  private referencedAppMaps = new Set<AppMapName>();

  add(revisionName: RevisionName, appmap: AppMapName) {
    assert(!appmap.endsWith('.appmap.json'), `AppMap ${appmap} must not have an extension`);

    this.referencedAppMaps.add(join(revisionName, appmap));
  }

  test(revisionName: RevisionName, appmap: AppMapName): boolean {
    assert(!appmap.endsWith('.appmap.json'), `AppMap ${appmap} must not have an extension`);

    return this.referencedAppMaps.has(join(revisionName, appmap));
  }
}

export type AppMapMetadata = { [K in BaseOrHead]: Map<AppMapName, Metadata> };

// Gets a function that returns true if the given appmap is a test.
function isTest(
  revisionName: RevisionName,
  appMapMetadata: AppMapMetadata
): (appmap: AppMapName) => boolean {
  return (appmap: AppMapName): boolean => {
    const metadata = appMapMetadata[revisionName].get(appmap);
    return !!(metadata && metadata.recorder.type === 'tests');
  };
}

// Selects AppMaps that have stable names, and are not found in a base reference set.
export function isAdded(
  referenceSet: Set<AppMapName>,
  isTestFn: (appmap: AppMapName) => boolean
): (appmap: AppMapName) => boolean {
  return (appmap: AppMapName) => isTestFn(appmap) && !referenceSet.has(appmap);
}

// Selects AppMaps that is present in the reference set, and have different digests.
export function isChanged(
  referenceSet: Set<AppMapName>,
  isTestFn: (appmap: AppMapName) => boolean,
  digests: Digests
): (appmap: AppMapName) => boolean {
  return (appmap: AppMapName) => {
    const baseDigest = digests.appmapDigest(RevisionName.Base, appmap);
    const headDigest = digests.appmapDigest(RevisionName.Head, appmap);
    return (
      isTestFn(appmap) &&
      referenceSet.has(appmap) &&
      !!baseDigest &&
      !!headDigest &&
      baseDigest !== headDigest
    );
  };
}

export default interface ChangeAnalysis {
  workingDir: string;
  srcDir: string;
  baseRevision: string;
  headRevision: string;
  paths: Paths;
  digests: Digests;
  baseManifest: ArchiveMetadata;
  headManifest: ArchiveMetadata;
  baseAppMaps: Set<AppMapName>;
  headAppMaps: Set<AppMapName>;
  appMapMetadata: AppMapMetadata;
  newAppMaps: string[];
  removedAppMaps: string[];
  changedAppMaps: string[];
  failedAppMaps: Set<AppMapName>;
  findingDiff?: Record<'new' | 'resolved', Finding[]>;
  referencedAppMaps: ReferencedAppMaps;
}

export async function analyzeChanges(
  workingDir: string,
  srcDir: string,
  baseRevision: string,
  headRevision: string
): Promise<ChangeAnalysis> {
  const changeAnalysis = new ChangeAnalysisImpl(workingDir, srcDir, baseRevision, headRevision);
  await changeAnalysis.initialize();

  assert(
    changeAnalysis.baseManifest &&
      changeAnalysis.headManifest &&
      changeAnalysis.baseAppMaps &&
      changeAnalysis.headAppMaps &&
      changeAnalysis.appMapMetadata &&
      changeAnalysis.newAppMaps &&
      changeAnalysis.removedAppMaps &&
      changeAnalysis.changedAppMaps &&
      changeAnalysis.failedAppMaps
  );

  return {
    workingDir: changeAnalysis.workingDir,
    srcDir: changeAnalysis.srcDir,
    baseRevision: changeAnalysis.baseRevision,
    headRevision: changeAnalysis.headRevision,
    paths: changeAnalysis.paths,
    digests: changeAnalysis.digests,
    baseManifest: changeAnalysis.baseManifest,
    headManifest: changeAnalysis.headManifest,
    baseAppMaps: changeAnalysis.baseAppMaps,
    headAppMaps: changeAnalysis.headAppMaps,
    appMapMetadata: changeAnalysis.appMapMetadata,
    newAppMaps: changeAnalysis.newAppMaps,
    removedAppMaps: changeAnalysis.removedAppMaps,
    changedAppMaps: changeAnalysis.changedAppMaps,
    failedAppMaps: changeAnalysis.failedAppMaps,
    findingDiff: changeAnalysis.findingDiff,
    referencedAppMaps: changeAnalysis.referencedAppMaps,
  };
}

export class ChangeAnalysisImpl {
  paths: Paths;
  digests: Digests;
  baseManifest?: ArchiveMetadata;
  headManifest?: ArchiveMetadata;
  baseAppMaps?: Set<AppMapName>;
  headAppMaps?: Set<AppMapName>;
  appMapMetadata?: AppMapMetadata;
  failedAppMaps?: Set<AppMapName>;
  findingDiff?: Record<'new' | 'resolved', Finding[]>;
  referencedAppMaps = new ReferencedAppMaps();
  newAppMaps?: string[];
  removedAppMaps?: string[];
  changedAppMaps?: string[];

  constructor(
    public workingDir: string,
    public srcDir: string,
    public baseRevision: string,
    public headRevision: string
  ) {
    this.paths = new Paths(workingDir);
    this.digests = new Digests(this.paths);
  }

  async initialize() {
    await this.digests.build();

    this.baseManifest = JSON.parse(
      await readFile(this.paths.manifestPath(RevisionName.Base), 'utf-8')
    );
    this.headManifest = JSON.parse(
      await readFile(this.paths.manifestPath(RevisionName.Head), 'utf-8')
    );

    this.baseAppMaps = new Set(await this.paths.appmaps(RevisionName.Base));
    this.headAppMaps = new Set(await this.paths.appmaps(RevisionName.Head));

    await this.loadMetadata();
    await this.loadFailedAppMaps();
    await this.loadAppMapChanges();
    if (this.failedAppMaps?.size === 0) await this.loadFindingDiff();
    await this.computeReferencedAppMaps();
  }

  async loadAppMapChanges() {
    const { baseAppMaps, headAppMaps, appMapMetadata } = this;
    assert(baseAppMaps && headAppMaps && appMapMetadata);

    const isNewFn = isAdded(baseAppMaps, isTest(RevisionName.Head, appMapMetadata));
    const isRemovedFn = isAdded(headAppMaps, isTest(RevisionName.Base, appMapMetadata));
    const isChangedFn = isChanged(
      baseAppMaps,
      isTest(RevisionName.Head, appMapMetadata),
      this.digests
    );

    this.newAppMaps = [...headAppMaps].filter(isNewFn);
    this.removedAppMaps = [...baseAppMaps].filter(isRemovedFn);
    this.changedAppMaps = [...headAppMaps].filter(isChangedFn);
  }

  async computeReferencedAppMaps() {
    const {
      appMapMetadata,
      failedAppMaps,
      findingDiff,
      newAppMaps,
      removedAppMaps,
      changedAppMaps,
    } = this;

    assert(appMapMetadata && failedAppMaps && newAppMaps && removedAppMaps && changedAppMaps);
    assert(failedAppMaps || findingDiff);

    const referenceAppMapFn = (appmap: AppMapName) =>
      [RevisionName.Base, RevisionName.Head].forEach((revisionName) =>
        this.referencedAppMaps.add(revisionName, appmap)
      );
    const referenceFindingAppMapFn = async (revisionName: RevisionName, finding: Finding) => {
      const { appMapFile } = finding;
      const appmap = appMapFile.slice(0, -'.appmap.json'.length);
      const path = this.paths.appmapPath(revisionName, appmap);
      // A sanity check
      if (!(await exists(path)))
        warn(`AppMap ${path}, referenced by finding ${finding.hash_v2}, does not exist.`);
      referenceAppMapFn(appmap);
    };

    newAppMaps.forEach((appmap) => referenceAppMapFn(appmap));
    removedAppMaps.forEach((appmap) => referenceAppMapFn(appmap));
    changedAppMaps.forEach((appmap) => referenceAppMapFn(appmap));
    failedAppMaps.forEach((appmap) => referenceAppMapFn(appmap));

    if (findingDiff) {
      for (const finding of findingDiff.new || [])
        referenceFindingAppMapFn(RevisionName.Head, finding);
      for (const finding of findingDiff.resolved || [])
        referenceFindingAppMapFn(RevisionName.Base, finding);
    }

    const sequenceDiagramExists = async (revisionName: RevisionName, appmap: AppMapName) => {
      const path = this.paths.sequenceDiagramPath(revisionName, appmap);
      return await exists(path);
    };

    // Limit AppMap metadata to only those AppMaps that have a sequence diagram.
    for (const revisionName of [RevisionName.Base, RevisionName.Head]) {
      const metadataByPath = appMapMetadata[revisionName];
      for (const appmap of metadataByPath.keys()) {
        if (!(await sequenceDiagramExists(revisionName as RevisionName, appmap))) {
          warn(`No sequence diagram found for ${revisionName} AppMap ${appmap}`);
          metadataByPath.delete(appmap);
        }
      }
    }
  }

  async loadMetadata() {
    const appMapMetadata = {
      base: new Map<AppMapName, Metadata>(),
      head: new Map<AppMapName, Metadata>(),
    };
    const q = queue(
      async (appmap: { revisionName: RevisionName.Base | RevisionName.Head; name: string }) => {
        const metadataPath = this.paths.metadataPath(appmap.revisionName, appmap.name);
        if (!(await exists(metadataPath))) {
          console.warn(`Metadata file ${metadataPath} does not exist!`);
          return;
        }

        const metadata = JSON.parse(await readFile(metadataPath, 'utf-8')) as Metadata;
        appMapMetadata[appmap.revisionName].set(appmap.name, metadata);
      },
      2
    );
    q.error(console.warn);
    for (const revisionName of [RevisionName.Base, RevisionName.Head]) {
      (await this.paths.appmaps(revisionName)).forEach((appmap) =>
        q.push({
          revisionName: revisionName as RevisionName.Base | RevisionName.Head,
          name: appmap,
        })
      );
    }
    if (!q.idle()) await q.drain();
    this.appMapMetadata = appMapMetadata;
  }

  async loadFailedAppMaps() {
    assert(this.appMapMetadata);
    const failedAppMaps = new Set<AppMapName>();
    {
      for (const appmap of await this.paths.appmaps(RevisionName.Head)) {
        const metadata = this.appMapMetadata[RevisionName.Head].get(appmap);
        if (!metadata) {
          console.warn(`Metadata for ${appmap} not found`);
          continue;
        }
        if (metadata.test_status === 'failed') failedAppMaps.add(appmap);
      }
    }
    this.failedAppMaps = failedAppMaps;
  }

  async loadFindingDiff() {
    const { baseManifest, headManifest, paths } = this;
    assert(baseManifest && headManifest && paths);

    const baseFindings = await loadFindings(paths, RevisionName.Base, baseManifest.appMapDir);
    const headFindings = await loadFindings(paths, RevisionName.Head, headManifest.appMapDir);

    let newFindings: Finding[];
    let resolvedFindings: Finding[];

    const baseFindingHashes = baseFindings.reduce(
      (memo, finding: Finding) => (memo.add(finding.hash_v2), memo),
      new Set<string>()
    );
    const headFindingHashes = headFindings.reduce(
      (memo, finding: Finding) => (memo.add(finding.hash_v2), memo),
      new Set<string>()
    );
    const newFindingHashes = [...headFindingHashes].filter((hash) => !baseFindingHashes.has(hash));
    const resolvedFindingHashes = [...baseFindingHashes].filter(
      (hash) => !headFindingHashes.has(hash)
    );
    newFindings = Object.values(
      headFindings
        .filter((finding) => newFindingHashes.includes(finding.hash_v2))
        .reduce((memo, finding) => {
          if (!(finding.hash_v2 in memo)) memo[finding.hash_v2] = finding;
          return memo;
        }, {})
    );
    resolvedFindings = Object.values(
      baseFindings
        .filter((finding) => resolvedFindingHashes.includes(finding.hash_v2))
        .reduce((memo, finding) => {
          if (!(finding.hash_v2 in memo)) memo[finding.hash_v2] = finding;
          return memo;
        }, {})
    );

    this.findingDiff = {
      new: newFindings,
      resolved: resolvedFindings,
    };
  }
}
