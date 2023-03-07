import { copyFile, readFile, writeFile } from 'fs/promises';
import { basename, dirname, isAbsolute, join } from 'path';
import { existsSync } from 'fs';
import {
  buildDiagram,
  Diagram,
  format,
  FormatType,
  SequenceDiagramOptions,
  Specification,
} from '@appland/sequence-diagram';
import { AppMap, CodeObject, buildAppMap, Event } from '@appland/models';
import { readDiagramFile } from '../cmds/sequenceDiagram/readDiagramFile';
import { executeCommand } from './executeCommand';
import { RevisionName } from './RevisionName';
import { OperationReference } from './OperationReference';
import { promisify } from 'util';
import { glob } from 'glob';

type Metadata = {
  sourceLocation: string | undefined;
  appmapName: string | undefined;
  sourcePaths: string[];
  testStatus?: string;
};

export class AppMapReference {
  // Set of all source files that were used by the app.
  public sourcePaths = new Set<string>();
  // Name of the test case that produced these AppMaps.
  public sourceLocation: string | undefined;
  public appmapName: string | undefined;

  constructor(
    private operationReference: OperationReference,
    public outputDir: string,
    public appmapFileName: string
  ) {}

  static outputPath(outputDir: string, revisionName: RevisionName): string {
    return join(outputDir, revisionName);
  }

  async sourceDiff(baseRevision: string): Promise<string | undefined> {
    if (this.sourcePaths.size === 0) return;

    const existingSourcePaths = [...this.sourcePaths].filter(existsSync).sort();
    return (
      await executeCommand(
        `git diff ${baseRevision} -- ${existingSourcePaths.join(' ')}`,
        false,
        false,
        false
      )
    ).trim();
  }

  sequenceDiagramFileName(format: string): string {
    return [basename(this.appmapFileName, '.appmap.json'), `sequence.${format}`].join('.');
  }

  metadataFileName(): string {
    return [basename(this.appmapFileName, '.appmap.json'), `metadata.json`].join('.');
  }

  sequenceDiagramFilePath(
    revisionName: RevisionName,
    format: FormatType | string,
    includeOutputDir: boolean
  ): string {
    const tokens = [revisionName, this.sequenceDiagramFileName(format)];
    if (includeOutputDir) tokens.unshift(this.outputDir);
    return join(...tokens);
  }

  archivedAppMapFilePath(revisionName: RevisionName, includeOutputDir: boolean): string {
    const tokens = [revisionName, basename(this.appmapFileName)];
    if (includeOutputDir) tokens.unshift(this.outputDir);
    return join(...tokens);
  }

  /**
   * Gets the AppMap file names of failed test cases.
   */
  static async listFailedTests(outputDir: string, revisionName: RevisionName): Promise<string[]> {
    const metadataFiles = await promisify(glob)(`${outputDir}/${revisionName}/*.metadata.json`);
    const result = new Array<string>();
    for (const metadataFile of metadataFiles) {
      const metadata = JSON.parse(await readFile(metadataFile, 'utf-8')) as Metadata;
      if (metadata.testStatus === 'failed') {
        result.push(
          join(
            dirname(metadataFile),
            [basename(metadataFile, '.metadata.json'), 'appmap.json'].join('.')
          )
        );
      }
    }
    return result;
  }

  async loadSequenceDiagramJSON(revisionName: RevisionName): Promise<Diagram> {
    return readDiagramFile(this.sequenceDiagramFilePath(revisionName, FormatType.JSON, true));
  }

  async loadSequenceDiagramText(revisionName: RevisionName): Promise<string> {
    return await readFile(
      this.sequenceDiagramFilePath(revisionName, FormatType.Text, true),
      'utf-8'
    );
  }

  async processAppMap(revisionName: RevisionName) {
    const appmap = await this.loadAppMap();

    this.collectAppMapOperationData(revisionName, appmap);
    const metadata = AppMapReference.collectMetadata(appmap);
    const diagram = await this.buildSequenceDiagram(appmap);

    await copyFile(this.appmapFileName, this.archivedAppMapFilePath(revisionName, true));
    await writeFile(
      this.archivedMetadataFilePath(revisionName, true),
      JSON.stringify(metadata, null, 2)
    );
    await writeFile(
      this.sequenceDiagramFilePath(revisionName, FormatType.JSON, true),
      format(FormatType.JSON, diagram, this.appmapFileName).diagram
    );
    await writeFile(
      this.sequenceDiagramFilePath(revisionName, FormatType.JSON, true),
      format(FormatType.JSON, diagram, this.appmapFileName).diagram
    );
    await writeFile(
      this.sequenceDiagramFilePath(revisionName, FormatType.Text, true),
      format(FormatType.Text, diagram, this.appmapFileName).diagram
    );
  }

  async restoreMetadata(revisionName: RevisionName) {
    const appmapData = JSON.parse(
      await readFile(this.archivedAppMapFilePath(revisionName, true), 'utf-8')
    );
    const appmap = buildAppMap().source(appmapData).build();

    this.collectAppMapOperationData(revisionName, appmap);
    const metadata = JSON.parse(
      await readFile(this.archivedMetadataFilePath(revisionName, true), 'utf-8')
    );

    this.sourceLocation = metadata.sourceLocation;
    this.appmapName = metadata.appmapName;
    this.sourcePaths = new Set(metadata.sourcePaths);
  }

  private async buildSequenceDiagram(appmap: AppMap): Promise<Diagram> {
    const specOptions = { loops: false } as SequenceDiagramOptions;
    const specification = Specification.build(appmap, specOptions);
    return buildDiagram(this.appmapFileName, appmap, specification);
  }

  private async loadAppMap(): Promise<AppMap> {
    const appmapData = JSON.parse(await readFile(this.appmapFileName, 'utf-8'));
    return buildAppMap().source(appmapData).build();
  }

  private archivedMetadataFilePath(revisionName: RevisionName, includeOutputDir: boolean): string {
    const tokens = [revisionName, this.metadataFileName()];
    if (includeOutputDir) tokens.unshift(this.outputDir);
    return join(...tokens);
  }

  private collectAppMapOperationData(revisionName: RevisionName, appmap: AppMap) {
    for (let eventId = 0; eventId < appmap.events.length; eventId++) {
      const event = appmap.events[eventId];
      if (event.httpServerRequest && event.httpServerResponse) {
        const requestAppMap = AppMapReference.buildServerRPCAppMap(appmap, event);
        this.operationReference.addServerRPC(revisionName, requestAppMap);
        eventId = event.returnEvent.id;
      }
    }
  }

  private static buildServerRPCAppMap(appmap: AppMap, event: Event) {
    const startId = event.id;
    const endId = event.returnEvent.id;
    const events = appmap.events.filter((e) => {
      if (e.id < startId || e.id > endId) return false;

      if (e.codeObject.type !== 'function') return true;

      const { isLocal } = AppMapReference.isLocalPath(e.codeObject.location);
      return isLocal;
    });

    return buildAppMap({
      events,
      classMap: appmap.classMap.roots.map((c) => ({ ...c.data })),
      metadata: appmap.metadata,
    }).build();
  }

  static isLocalPath(location?: string): { isLocal: boolean; path?: string } {
    if (!location) return { isLocal: false };

    if (!location.includes(':')) return { isLocal: false };

    const path = location.split(':')[0];
    if (path.match(/\.\w+$/) && !isAbsolute(path)) return { isLocal: true, path };

    return { isLocal: false };
  }

  static collectPath(codeObject: CodeObject, fn: (path: string) => void) {
    const { isLocal, path } = AppMapReference.isLocalPath(codeObject.location);

    if (isLocal && path) fn(path);
  }

  private static collectMetadata(appmap: AppMap): Metadata {
    const sourcePaths = new Set<string>();

    const collectSourcePath = (codeObject: CodeObject) => {
      AppMapReference.collectPath(codeObject, (path) => sourcePaths.add(path));
    };

    appmap.classMap.visit(collectSourcePath);

    return {
      sourceLocation: (appmap.metadata as any).source_location,
      appmapName: appmap.metadata.name,
      testStatus: appmap.metadata.test_status,
      sourcePaths: [...sourcePaths].sort(),
    };
  }
}
