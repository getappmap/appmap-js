import { readFile } from 'fs/promises';
import { basename, isAbsolute, join } from 'path';
import { existsSync } from 'fs';
import {
  buildDiagram,
  Diagram,
  FormatType,
  SequenceDiagramOptions,
  Specification,
} from '@appland/sequence-diagram';
import { AppMap, CodeObject, buildAppMap } from '@appland/models';
import { readDiagramFile } from '../cmds/sequenceDiagram/readDiagramFile';
import { executeCommand } from '../cmds/describeChange';
import { RevisionName } from './RevisionName';

export class AppMapReference {
  // Set of all source files that were used by the app.
  public sourcePaths = new Set<string>();
  // Name of the test case that produced these AppMaps.
  public sourceLocation: string | undefined;
  public appmapName: string | undefined;

  constructor(public outputDir: string, public appmapFileName: string) {}

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

  async buildSequenceDiagram(): Promise<Diagram> {
    const specOptions = { loops: false } as SequenceDiagramOptions;
    const appmap = await this.buildAppMap();
    const specification = Specification.build(appmap, specOptions);
    return buildDiagram(this.appmapFileName, appmap, specification);
  }

  async buildAppMap(): Promise<AppMap> {
    const appmapData = JSON.parse(await readFile(this.appmapFileName, 'utf-8'));
    const appmap = buildAppMap().source(appmapData).build();
    this.populateMetadata(appmap);
    return appmap;
  }

  populateMetadata(appmap: AppMap): void {
    if (appmap.metadata) {
      if (!this.sourceLocation) this.sourceLocation = (appmap.metadata as any).source_location;
      if (!this.appmapName) this.appmapName = appmap.metadata.name;
    }
    const collectSourcePath = (codeObject: CodeObject) => {
      const location = codeObject.location;
      if (location) {
        const path = location.split(':')[0];
        if (!isAbsolute(path)) this.sourcePaths.add(path);
      }
    };
    appmap.classMap.visit(collectSourcePath);
  }
}
