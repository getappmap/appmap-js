import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { default as openapiDiff } from 'openapi-diff';
import { dirname, isAbsolute, join, relative, resolve } from 'path';
import { ClassMap, Metadata } from '@appland/models';
import { FormatType, format } from '@appland/sequence-diagram';
import { queue } from 'async';
import assert from 'assert';

import { DiffDiagrams } from '../../sequenceDiagramDiff/DiffDiagrams';
import { ArchiveMetadata } from '../archive/ArchiveMetadata';
import { Paths } from './Paths';
import { Digests } from './Digests';
import { RevisionName } from './RevisionName';
import { AppMapLink, AppMapName, ChangeReport, ChangedAppMap, TestFailure } from './ChangeReport';
import { exists, verbose } from '../../utils';
import mapToRecord from './mapToRecord';
import { mutedStyle, prominentStyle } from './ui';
import { executeCommand } from '../../lib/executeCommand';
import { Finding, ImpactDomain } from '../../lib/findings';
import loadFindings from './loadFindings';
import { loadSequenceDiagram } from './loadSequenceDiagram';
import { warn } from 'console';

export type BaseOrHead = RevisionName.Base | RevisionName.Head;

export const DEFAULT_SNIPPET_WIDTH = 10;

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

class SourceDiff {
  private diffs = new Map<AppMapName, string>();
  private classMaps = new Map<AppMapName, ClassMap>();

  constructor(private reporter: ChangeReporter) {}

  async get(appmap: AppMapName): Promise<string | undefined> {
    [RevisionName.Base, RevisionName.Head].forEach((revisionName) =>
      assert(
        !appmap.startsWith(revisionName),
        `AppMap ${appmap} must not start with a revision name`
      )
    );

    const yieldDiff = (diff: string) => (diff !== '' ? diff : undefined);

    let diff = this.diffs.get(appmap);
    if (diff) return Promise.resolve(yieldDiff(diff));

    diff = await this.loadDiff(appmap);
    this.diffs.set(appmap, diff);
    return yieldDiff(diff);
  }

  async loadDiff(appmap: string): Promise<string> {
    const loadClassMap = async (): Promise<ClassMap> => {
      const classMapData = JSON.parse(
        await readFile(join(this.reporter.paths.classMapPath(RevisionName.Head, appmap)), 'utf-8')
      );
      return new ClassMap(classMapData);
    };

    const classMap = this.classMaps.get(appmap) || (await loadClassMap());
    const sourcePaths = new Set<string>();
    classMap.visit((codeObject) => {
      if (!codeObject.location) return;

      const path = codeObject.location.split(':')[0];
      if (path.indexOf('.') && !path.startsWith('<') && !isAbsolute(path)) sourcePaths.add(path);
    });

    let diff = '';
    if (sourcePaths.size > 0) {
      const paths = [...sourcePaths]
        .sort()
        .map((p) => [this.reporter.srcDir, p].join('/'))
        .join(' ');
      diff = await executeCommand(
        `git diff ${this.reporter.baseRevision}..${this.reporter.headRevision} -- ${paths}`
      );
    }

    return diff;
  }
}

export type AppMapMetadata = { [K in BaseOrHead]: Map<AppMapName, Metadata> };

export class ChangeReportOptions {
  reportRemoved = true;
  snippetWidth = DEFAULT_SNIPPET_WIDTH;
}

export default class ChangeReporter {
  paths: Paths;
  digests: Digests;
  baseManifest?: ArchiveMetadata;
  headManifest?: ArchiveMetadata;
  baseAppMaps?: Set<AppMapName>;
  headAppMaps?: Set<AppMapName>;
  appMapMetadata?: AppMapMetadata;
  failedAppMaps?: Set<AppMapName>;
  referencedAppMaps = new ReferencedAppMaps();
  sourceDiff = new SourceDiff(this);

  constructor(
    public baseRevision: string,
    public headRevision: string,
    public workingDir: string,
    public srcDir: string
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
  }

  async deleteUnreferencedAppMaps() {
    const deleteAppMap = async (revisionName: RevisionName, appmap: AppMapName) => {
      if (verbose())
        console.log(
          mutedStyle(`AppMap ${revisionName}/${appmap} is unreferenced so it will be deleted.`)
        );
      const path = this.paths.appmapPath(revisionName, appmap);
      const fileName = [path, 'appmap.json'].join('.');
      await rm(fileName);
      await rm(path, { recursive: true });
    };

    for (const revisionName of [RevisionName.Base, RevisionName.Head]) {
      for (const appmap of await this.paths.appmaps(revisionName)) {
        if (!this.referencedAppMaps.test(revisionName, appmap))
          try {
            await deleteAppMap(revisionName, appmap);
          } catch (err) {
            warn(
              `Failed to delete unreferenced AppMap ${revisionName}/${appmap}. Will continue...`
            );
          }
      }
    }
  }

  async report(options: ChangeReportOptions): Promise<ChangeReport> {
    const { appMapMetadata, baseAppMaps, headAppMaps, failedAppMaps } = this;
    assert(appMapMetadata);
    assert(baseAppMaps);
    assert(headAppMaps);
    assert(failedAppMaps);

    const generator = new ReportFieldCalculator(this);
    const apiDiff = await generator.apiDiff(options.reportRemoved);

    const isNewFn = isNew(baseAppMaps, isTest(appMapMetadata));
    const isChangedFn = isChanged(baseAppMaps, isTest(appMapMetadata), this.digests);
    const referenceAppMapFn = (appmap: AppMapName) =>
      [RevisionName.Base, RevisionName.Head].forEach((revisionName) =>
        this.referencedAppMaps.add(revisionName, appmap)
      );
    const referenceFindingAppMapFn = async (revisionName: RevisionName, finding: Finding) => {
      const { appMapFile } = finding;
      const appmap = appMapFile.slice(0, -'.appmap.json'.length);
      const path = [this.paths.appmapPath(revisionName, appmap), 'appmap.json'].join('.');
      // A sanity check
      if (!(await exists(path)))
        warn(`AppMap ${path}, referenced by finding ${finding.hash_v2}, does not exist.`);
      referenceAppMapFn(appmap);
    };

    const newAppMaps = [...headAppMaps].filter(isNewFn);
    const changedAppMaps = [...headAppMaps].filter(isChangedFn).map((appmap) => ({ appmap }));

    changedAppMaps.forEach(({ appmap }) => referenceAppMapFn(appmap));

    const failureFn = buildFailure(appMapMetadata, options.snippetWidth);
    const testFailures = new Array<TestFailure>();
    for (const appmap of failedAppMaps) {
      const testFailure = await failureFn(appmap);
      if (testFailure) {
        testFailures.push(testFailure);
        referenceAppMapFn(appmap);
      }
    }

    let findingDiff: Record<'new' | 'resolved', Finding[]> | undefined;
    if (testFailures.length === 0) {
      findingDiff = await generator.findingDiff(options.reportRemoved);
      for (const finding of findingDiff.new || [])
        referenceFindingAppMapFn(RevisionName.Head, finding);
      for (const finding of findingDiff.resolved || [])
        referenceFindingAppMapFn(RevisionName.Base, finding);
    }

    const result: ChangeReport = {
      testFailures,
      newAppMaps,
      changedAppMaps,
      sequenceDiagramDiff: await generator.sequenceDiagramDiff(changedAppMaps),
      appMapMetadata: await generator.appMapMetadata(),
    };

    if (findingDiff) result.findingDiff = findingDiff;
    if (apiDiff) result.apiDiff = apiDiff;

    return result;
  }

  private async loadMetadata() {
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

  private async loadFailedAppMaps() {
    assert(this.appMapMetadata);
    const failedAppMaps = new Set<AppMapName>();
    {
      for (const appmap of await this.paths.appmaps(RevisionName.Head)) {
        const metadata = this.appMapMetadata[RevisionName.Head].get(appmap);
        if (!metadata) {
          console.log(prominentStyle(`Metadata for ${appmap} not found!`));
          continue;
        }
        if (metadata.test_status === 'failed') failedAppMaps.add(appmap);
      }
    }
    this.failedAppMaps = failedAppMaps;
  }
}

// Gets a function that returns true if the given appmap is a test.
function isTest(appMapMetadata: AppMapMetadata): (appmap: AppMapName) => boolean {
  return (appmap: AppMapName): boolean => {
    const metadata = appMapMetadata[RevisionName.Head].get(appmap);
    return !!(metadata && metadata.recorder.type === 'tests');
  };
}

// Selects AppMaps that have stable names, and are in the head revision but not in the base revision.
export function isNew(
  baseAppMaps: Set<AppMapName>,
  isTestFn: (appmap: AppMapName) => boolean
): (appmap: AppMapName) => boolean {
  return (appmap: AppMapName) => isTestFn(appmap) && !baseAppMaps.has(appmap);
}

// Selects AppMaps that are present in both the base and head revisions, and have different digests.
export function isChanged(
  baseAppMaps: Set<AppMapName>,
  isTestFn: (appmap: AppMapName) => boolean,
  digests: Digests
): (appmap: AppMapName) => boolean {
  return (appmap: AppMapName) => {
    const baseDigest = digests.appmapDigest(RevisionName.Base, appmap);
    const headDigest = digests.appmapDigest(RevisionName.Head, appmap);
    return (
      isTestFn(appmap) &&
      baseAppMaps.has(appmap) &&
      !!baseDigest &&
      !!headDigest &&
      baseDigest !== headDigest
    );
  };
}

export function buildFailure(
  appMapMetadata: AppMapMetadata,
  snippetWidth = DEFAULT_SNIPPET_WIDTH
): (appmap: AppMapName) => Promise<TestFailure | undefined> {
  return async (appmap: AppMapName) => {
    const metadata = appMapMetadata[RevisionName.Head].get(appmap);
    if (!metadata) {
      warn(`No AppMap metadata available for failed test ${appmap}`);
      return;
    }
    const testFailure = {
      appmap,
      name: metadata.name,
    } as TestFailure;
    if (metadata.source_location) {
      testFailure.testLocation = isAbsolute(metadata.source_location)
        ? relative(process.cwd(), metadata.source_location)
        : metadata.source_location;
    }
    if (metadata.test_failure) {
      testFailure.failureMessage = metadata.test_failure.message;
      const location = metadata.test_failure.location;
      if (location) {
        testFailure.failureLocation = location;
        const [path, linenoStr] = location.split(':');
        if (linenoStr && (await exists(path))) {
          const lineno = parseInt(linenoStr, 10);
          const testCode = (await readFile(path, 'utf-8')).split('\n');
          const minIndex = Math.max(lineno - snippetWidth, 0);
          const maxIndex = Math.min(lineno + snippetWidth, testCode.length);
          testFailure.testSnippet = {
            codeFragment: testCode.slice(minIndex, maxIndex).join('\n'),
            startLine: minIndex + 1,
            language: metadata.language?.name,
          };
        }
      }
    }
    return testFailure;
  };
}

export class ReportFieldCalculator {
  constructor(public reporter: ChangeReporter) {}

  async appMapMetadata(): Promise<{
    [K in BaseOrHead]: Record<AppMapName, Metadata>;
  }> {
    assert(this.reporter.appMapMetadata);
    return {
      [RevisionName.Base]: mapToRecord(this.reporter.appMapMetadata[RevisionName.Base]),
      [RevisionName.Head]: mapToRecord(this.reporter.appMapMetadata[RevisionName.Head]),
    };
  }

  async sequenceDiagramDiff(changedAppMaps: ChangedAppMap[]): Promise<Record<string, string[]>> {
    const diffDiagrams = new DiffDiagrams();
    const sequenceDiagramDiff = new Map<string, AppMapLink[]>();
    {
      const q = queue(async (changedAppMap: ChangedAppMap) => {
        const { appmap } = changedAppMap;

        const sourceDiff = await this.reporter.sourceDiff.get(appmap);
        if (sourceDiff) changedAppMap.sourceDiff = sourceDiff;

        const baseDiagram = await loadSequenceDiagram(
          this.reporter.paths.sequenceDiagramPath(RevisionName.Base, appmap)
        );
        const headDiagram = await loadSequenceDiagram(
          this.reporter.paths.sequenceDiagramPath(RevisionName.Head, appmap)
        );
        const diagramDiff = diffDiagrams.diff(baseDiagram, headDiagram);
        if (diagramDiff) {
          const diagramJSON = format(FormatType.JSON, diagramDiff, 'diff');
          const path = this.reporter.paths.sequenceDiagramDiffPath(appmap);
          await mkdir(dirname(path), { recursive: true });
          await writeFile(path, diagramJSON.diagram);
          changedAppMap.sequenceDiagramDiff = relative(
            join(this.reporter.workingDir, 'diff'),
            path
          );

          // Build a text snippet for each top level context.
          const allActions = [...diagramDiff.rootActions];
          for (let actionIndex = 0; actionIndex < diagramDiff.rootActions.length; actionIndex++) {
            const action = diagramDiff.rootActions[actionIndex];
            diagramDiff.rootActions = [action];
            const snippet = format(FormatType.Text, diagramDiff, 'diff');
            // TODO: nop if this is the empty string
            if (!sequenceDiagramDiff.has(snippet.diagram))
              sequenceDiagramDiff.set(snippet.diagram, []);
            sequenceDiagramDiff.get(snippet.diagram)?.push(appmap);
          }
          diagramDiff.rootActions = allActions;
        }
      }, 2);
      q.error(console.warn);
      changedAppMaps.forEach((appmap) => q.push(appmap));
      if (!q.idle()) await q.drain();
    }
    return mapToRecord(sequenceDiagramDiff);
  }

  async findingDiff(reportRemoved: boolean): Promise<Record<'new' | 'resolved', Finding[]>> {
    assert(this.reporter.baseManifest);
    assert(this.reporter.headManifest);

    const baseFindings = await loadFindings(
      this.reporter.paths,
      RevisionName.Base,
      this.reporter.baseManifest.appMapDir
    );
    const headFindings = await loadFindings(
      this.reporter.paths,
      RevisionName.Head,
      this.reporter.headManifest.appMapDir
    );

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
    newFindings = headFindings.filter((finding) => newFindingHashes.includes(finding.hash_v2));
    if (reportRemoved) {
      resolvedFindings = baseFindings.filter((finding) =>
        resolvedFindingHashes.includes(finding.hash_v2)
      );
    } else {
      resolvedFindings = [];
    }

    return {
      new: newFindings,
      resolved: resolvedFindings,
    };
  }

  async apiDiff(reportRemoved: boolean): Promise<any | undefined> {
    const readOpenAPI = async (revision: RevisionName) => {
      const openapiPath = this.reporter.paths.openapiPath(revision);
      try {
        return await readFile(openapiPath, 'utf-8');
      } catch (e) {
        if ((e as any).code === 'ENOENT') return undefined;
        throw e;
      }
    };

    const baseDefinitions = await readOpenAPI(RevisionName.Base);
    const headDefinitions = await readOpenAPI(RevisionName.Head);
    if (!baseDefinitions || !headDefinitions) return;

    let apiDiff: any;
    {
      const result = await openapiDiff.diffSpecs({
        sourceSpec: {
          content: baseDefinitions,
          location: 'base',
          format: 'openapi3',
        },
        destinationSpec: {
          content: headDefinitions,
          location: 'head',
          format: 'openapi3',
        },
      });

      if (!reportRemoved && result.breakingDifferencesFound) {
        const diffOutcomeFailure = result as any;
        diffOutcomeFailure.breakingDifferencesFound = false;
        delete diffOutcomeFailure['breakingDifferences'];
      }

      if (result.breakingDifferencesFound) {
        console.log('Breaking change found!');
      }
      apiDiff = result;
    }
    return apiDiff;
  }
}
