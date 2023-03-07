import { AppMap, CodeObject } from '@appland/models';
import {
  buildDiagram,
  Diagram,
  Diagram as SequenceDiagram,
  format,
  FormatType,
  SequenceDiagramOptions,
  Specification,
} from '@appland/sequence-diagram';
import assert from 'assert';
import * as async from 'async';
import { link, mkdir, unlink, writeFile } from 'fs/promises';
import { glob } from 'glob';
import { basename, join } from 'path';
import { promisify } from 'util';
import { readDiagramFile } from '../cmds/sequenceDiagram/readDiagramFile';
import { exists } from '../utils';
import { AppMapReference } from './AppMapReference';
import { RevisionName } from './RevisionName';

type Route = {
  method: string;
  path: string;
  status: number;
};

type QueueJob = { revisionName: RevisionName; appmap: AppMap; diagram: Diagram };

export class OperationReference {
  // Set of all source files, indexed by route ([<METHOD> <PATH> (<STATUS>)]).
  public sourcePathsByOperation = new Map<string, Set<string>>();

  // The queue has concurrency of 1, so it's used to ensure that only one route
  // is processed / updated at a time. It's essential to begin indexing with startIndexing,
  // and to wait for finishIndexing() to complete before continuing.
  private queue: async.QueueObject<QueueJob> | undefined;

  constructor(public outputDir: string) {}

  static operationKey(method: string, path: string, status: number): string {
    return `${method.toUpperCase()} ${path} (${status})`;
  }

  startIndexing() {
    this.queue = async.queue(async (job: QueueJob) => {
      try {
        const { revisionName, appmap, diagram } = job;
        assert(appmap.events[0].httpServerRequest, 'Expecting an HTTP server request (only)');
        const rootEvent = appmap.events[0];
        assert(rootEvent.httpServerRequest);
        assert(rootEvent.httpServerResponse);
        assert(diagram.rootActions.length === 1, 'Expecting a single root action');
        const { subtreeDigest } = diagram.rootActions[0];

        const method = rootEvent.httpServerRequest?.request_method.toUpperCase();
        const path =
          rootEvent.httpServerRequest.normalized_path_info || rootEvent.httpServerRequest.path_info;
        const status = rootEvent.httpServerResponse.status;

        const key = OperationReference.operationKey(method, path, status);
        appmap.classMap.visit((codeObject) => {
          AppMapReference.collectPath(codeObject, (path) =>
            this.addSourcePath(key, path, codeObject)
          );
        });

        await this.findOrCreateAppMap(revisionName, appmap, diagram);
        await this.saveLinks(revisionName, { method, path, status: status }, subtreeDigest);
      } catch (err) {
        console.warn(err);
      }
    }, 1);
  }

  // Returns true if the appmap was created, false if it already existed.
  async findOrCreateAppMap(
    revisionName: RevisionName,
    appmap: AppMap,
    diagram: Diagram
  ): Promise<boolean> {
    assert(diagram.rootActions.length === 1, 'Expecting a single root action');
    const { subtreeDigest } = diagram.rootActions[0];

    if (
      (await exists(this.diagramPath(revisionName, subtreeDigest))) &&
      (await exists(this.appmapPath(revisionName, subtreeDigest)))
    ) {
      return false;
    }

    await writeFile(this.appmapPath(revisionName, subtreeDigest), JSON.stringify(appmap, null, 2));
    await writeFile(
      this.diagramPath(revisionName, subtreeDigest),
      format(FormatType.JSON, diagram, subtreeDigest).diagram
    );
    return true;
  }

  async listSequenceDiagrams(revisionName: RevisionName, route: Route): Promise<string[]> {
    const files = await promisify(glob)(
      `${this.operationPath(revisionName, route)}/*.sequence.json`
    );
    return files.map((file) => basename(file, '.sequence.json'));
  }

  async loadSequenceDiagram(
    revisionName: RevisionName,
    subtreeDigest: string
  ): Promise<SequenceDiagram> {
    const diagramPath = this.diagramPath(revisionName, subtreeDigest);
    return readDiagramFile(diagramPath);
  }

  async finishIndexing() {
    if (!this.queue) return;

    this.queue.length() === 0 || (await this.queue.drain());

    this.queue = undefined;
  }

  addServerRPC(revisionName: RevisionName, appmap: AppMap) {
    assert(this.queue, 'OperationReference is not in processing mode');

    const specOptions = { loops: false } as SequenceDiagramOptions;
    const specification = Specification.build(appmap, specOptions);
    const diagram = buildDiagram('<appmap>', appmap, specification);

    this.queue.push({ revisionName, appmap, diagram });
  }

  private addSourcePath(key: string, path: string, codeObject: CodeObject): void {
    if (!this.sourcePathsByOperation.get(key))
      this.sourcePathsByOperation.set(key, new Set<string>());
    this.sourcePathsByOperation.get(key)!.add(path);
  }

  private async saveLinks(revisionName: RevisionName, route: Route, subtreeDigest: string) {
    await mkdir(this.operationPath(revisionName, route), {
      recursive: true,
    });

    const paths = [
      [
        this.diagramPath(revisionName, subtreeDigest),
        join(this.operationPath(revisionName, route), [subtreeDigest, 'sequence.json'].join('.')),
      ],
      [
        this.appmapPath(revisionName, subtreeDigest),
        join(this.operationPath(revisionName, route), [subtreeDigest, 'appmap.json'].join('.')),
      ],
    ];
    for (const [src, dest] of paths) {
      if (await exists(dest)) continue;

      await link(src, dest);
    }
  }

  private operationPath(revisionName: RevisionName, route: Route): string {
    let { path } = route;
    // To avoid a conflict with a real route, use a character that's invalid in a URL.
    // The mneumonic for '^' is that it's used in regexp to start a line.
    if (path === '/') path = '^';

    return join(
      this.outputDir,
      revisionName,
      'operations',
      route.method.toUpperCase(),
      path,
      route.status.toString()
    );
  }

  private appmapPath(revisionName: RevisionName, subtreeDigest: string): string {
    return join(
      this.outputDir,
      revisionName,
      'operations',
      [subtreeDigest, 'appmap.json'].join('.')
    );
  }

  private diagramPath(revisionName: RevisionName, subtreeDigest: string): string {
    return join(
      this.outputDir,
      revisionName,
      'operations',
      [subtreeDigest, 'sequence.json'].join('.')
    );
  }
}
