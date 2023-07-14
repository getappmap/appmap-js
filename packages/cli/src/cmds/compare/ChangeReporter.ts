import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { default as openapiDiff } from 'openapi-diff';
import { dirname, isAbsolute, join, relative } from 'path';
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
import { exists } from '../../utils';
import mapToRecord from './mapToRecord';
import { mutedStyle, prominentStyle } from './ui';
import { executeCommand } from '../../lib/executeCommand';
import { Finding, ImpactDomain } from '../../lib/findings';
import loadFindings from './loadFindings';
import { loadSequenceDiagram } from './loadSequenceDiagram';

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

export default class ChangeReporter {
  reportRemoved = true;

  paths: Paths;
  digests: Digests;
  baseManifest?: ArchiveMetadata;
  headManifest?: ArchiveMetadata;
  appMapMetadata?: { [K in BaseOrHead]: Map<string, Metadata> };
  failedAppMaps?: Set<string>;
  newAppMaps?: string[];
  changedAppMaps?: { appmap: AppMapName }[];
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

    await this.loadMetadata();

    const baseAppMaps = new Set(await this.paths.appmaps(RevisionName.Base));
    const headAppMaps = new Set(await this.paths.appmaps(RevisionName.Head));
    this.newAppMaps = [...headAppMaps].filter((appmap) => !baseAppMaps.has(appmap));
    this.changedAppMaps = [...headAppMaps]
      .filter((appmap) => baseAppMaps.has(appmap))
      .map((appmap) => ({ appmap }));

    this.changedAppMaps.forEach(
      ({ appmap }) => (
        this.referencedAppMaps.add(RevisionName.Base, appmap),
        this.referencedAppMaps.add(RevisionName.Head, appmap)
      )
    );

    await this.loadFailedAppMaps();
  }

  async deleteUnreferencedAppMaps() {
    const deleteAppMap = async (revisionName: RevisionName, appmap: AppMapName) => {
      console.log(
        mutedStyle(`AppMap ${revisionName}/${appmap} is unreferenced so it will be deleted.`)
      );
      const path = this.paths.appmapPath(revisionName, appmap);
      const fileName = [path, 'appmap.json'].join('.');
      assert(await exists(fileName));
      await rm(fileName);
      await rm(path, { recursive: true });
    };

    for (const revisionName of [RevisionName.Base, RevisionName.Head]) {
      (await this.paths.appmaps(revisionName)).forEach((appmap) => {
        if (!this.referencedAppMaps.test(revisionName, appmap)) deleteAppMap(revisionName, appmap);
      });
    }
  }

  async report(): Promise<ChangeReport> {
    const generator = new ReportGenerator(this);
    const apiDiff = await generator.apiDiff();

    const result: ChangeReport = {
      testFailures: await generator.testFailures(),
      newAppMaps: this.newAppMaps || [],
      changedAppMaps: this.changedAppMaps || [],
      findingDiff: await generator.findingDiff(),
      sequenceDiagramDiff: await generator.sequenceDiagramDiff(),
      appMapMetadata: await generator.appMapMetadata(),
    };

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
        if (metadata.test_status === 'failed') {
          this.referencedAppMaps.add(RevisionName.Head, appmap);
          failedAppMaps.add(appmap);
        }
      }
    }
    this.failedAppMaps = failedAppMaps;
  }
}

class ReportGenerator {
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

  async testFailures(): Promise<TestFailure[]> {
    assert(this.reporter.failedAppMaps);
    assert(this.reporter.appMapMetadata);
    const { failedAppMaps, appMapMetadata } = this.reporter;

    return (
      await Promise.all(
        [...failedAppMaps].map(async (appmap) => {
          const metadata = appMapMetadata[RevisionName.Head].get(appmap);
          if (!metadata) {
            console.log(`No Appmap metadata available for failed test ${appmap}`);
            return;
          }
          const testFailure = {
            appmap,
            name: metadata.name,
          } as TestFailure;
          if (metadata.source_location)
            testFailure.testLocation = relative(process.cwd(), metadata.source_location);
          if (metadata.test_failure) {
            testFailure.failureMessage = metadata.test_failure.message;
            const location = metadata.test_failure.location;
            if (location) {
              testFailure.failureLocation = location;
              const [path, linenoStr] = location.split(':');
              if (linenoStr && (await exists(path))) {
                const lineno = parseInt(linenoStr, 10);
                const testCode = (await readFile(path, 'utf-8')).split('\n');
                const minIndex = Math.max(lineno - 10, 0);
                const maxIndex = Math.min(lineno + 10, testCode.length);
                testFailure.testSnippet = {
                  codeFragment: testCode.slice(minIndex, maxIndex).join('\n'),
                  startLine: minIndex + 1,
                  language: metadata.language?.name,
                };
              }
            }
          }
          return testFailure;
        })
      )
    ).filter(Boolean) as TestFailure[];
  }

  async sequenceDiagramDiff(): Promise<Record<string, string[]>> {
    assert(this.reporter.changedAppMaps);

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
      this.reporter.changedAppMaps.forEach((appmap) => q.push(appmap));
      if (!q.idle()) await q.drain();
    }
    return mapToRecord(sequenceDiagramDiff);
  }

  async findingDiff(): Promise<Record<'new' & 'resolved', Finding[]>> {
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
    if (this.reporter.reportRemoved) {
      resolvedFindings = baseFindings.filter((finding) =>
        resolvedFindingHashes.includes(finding.hash_v2)
      );
    } else {
      resolvedFindings = [];
    }

    const result: Record<'new' & 'resolved', Finding[]> = {};
    if (newFindings.length > 0) result['new'] = newFindings;
    if (resolvedFindings.length > 0) result['resolved'] = resolvedFindings;
    return result;
  }

  async apiDiff(): Promise<any | undefined> {
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

      if (!this.reporter.reportRemoved && result.breakingDifferencesFound) {
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
