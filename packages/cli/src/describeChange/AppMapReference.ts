import { copyFile, readFile, writeFile } from 'fs/promises';
import { basename, isAbsolute, join } from 'path';
import { existsSync } from 'fs';
import {
  Action,
  buildDiagram,
  Diagram,
  format,
  FormatType,
  isServerRPC,
  SequenceDiagramOptions,
  ServerRPC,
  Specification,
} from '@appland/sequence-diagram';
import { AppMap, CodeObject, buildAppMap } from '@appland/models';
import { readDiagramFile } from '../cmds/sequenceDiagram/readDiagramFile';
import { executeCommand } from './executeCommand';
import { RevisionName } from './RevisionName';
import { OperationReference } from './OperationReference';

type Metadata = {
  sourceLocation: string | undefined;
  appmapName: string | undefined;
  sourcePaths: string[];
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

    this.collectAppMapOperationData(appmap);
    const metadata = AppMapReference.collectMetadata(appmap);
    const diagram = await this.buildSequenceDiagram(appmap);
    this.collectSequenceDiagramOperationData(revisionName, diagram);

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

  public async restoreMetadata(revisionName: RevisionName) {
    const appmapData = JSON.parse(
      await readFile(this.archivedAppMapFilePath(revisionName, true), 'utf-8')
    );
    const appmap = buildAppMap().source(appmapData).build();

    this.collectAppMapOperationData(appmap);
    const diagram = await this.buildSequenceDiagram(appmap);
    this.collectSequenceDiagramOperationData(revisionName, diagram);

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

  private collectAppMapOperationData(appmap: AppMap) {
    for (let eventId = 0; eventId < appmap.events.length; eventId++) {
      const event = appmap.events[eventId];
      if (event.httpServerRequest && event.httpServerResponse) {
        const method = event.httpServerRequest.request_method;
        const path =
          event.httpServerRequest.normalized_path_info || event.httpServerRequest.path_info;
        const status = event.httpServerResponse.status;
        const key = OperationReference.operationKey(method, path, status);
        while (eventId < event.returnEvent.id) {
          const event = appmap.events[eventId];
          AppMapReference.collectPath(event.codeObject, (path) =>
            this.operationReference.addSourcePath(key, path, event.codeObject)
          );
          eventId += 1;
        }
      }
    }
  }

  private collectSequenceDiagramOperationData(revisionName: RevisionName, diagram: Diagram) {
    const serverRPCActions: ServerRPC[] = [];

    const collectServerRPCActions = (action: Action) => {
      if (isServerRPC(action)) {
        serverRPCActions.push(action);
      } else {
        action.children.forEach(collectServerRPCActions);
      }
    };

    diagram.rootActions.forEach(collectServerRPCActions);

    serverRPCActions.forEach((action) => {
      this.operationReference.addServerRPC(revisionName, action);
    });
  }

  private static collectPath(codeObject: CodeObject, fn: (path: string) => void) {
    const location = codeObject.location;
    // If there's no line number, it's not considered a proper source location.
    // It may be native code, or some kind of pseudo-path.
    if (location && location.includes(':')) {
      const path = location.split(':')[0];
      if (path.match(/\.\w+$/) && !isAbsolute(path)) fn(path);
    }
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
      sourcePaths: [...sourcePaths].sort(),
    };
  }
}
