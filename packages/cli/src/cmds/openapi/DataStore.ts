import { Event } from '@appland/models';
import { parseHTTPServerRequests, rpcRequestForEvent } from '@appland/openapi';
import { RPCRequest } from '@appland/openapi/dist/rpcRequest';
import assert from 'assert';
import { log } from 'console';
import { closeSync, openSync, write, writeSync } from 'fs';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';

class RequestDataFile {
  bytesWritten = 0;

  constructor(private fd: number, public fileName: string) {
    const prefix = '[\n';
    this.bytesWritten = prefix.length;
    writeSync(fd, prefix);
  }

  async writeRequest(request: RPCRequest) {
    const json = JSON.stringify({
      status: request.status,
      parameters: request.parameters,
      returnValue: request.returnValue,
      requestHeaders: request.requestHeaders,
      responseHeaders: request.responseHeaders,
      requestContentType: request.requestContentType,
      responseContentType: request.responseContentType,
      requestMethod: request.requestMethod,
      requestPath: request.requestPath,
    });
    const indent = '  ';
    const lineEnding = ',\n';
    const line = [indent, json, lineEnding].join('');

    const { bytesWritten } = await promisify(write)(this.fd, line);
    this.bytesWritten += bytesWritten;
  }

  async close() {
    const fileEnding = `\n]\n`;
    writeSync(this.fd, fileEnding, this.bytesWritten - 2);
    closeSync(this.fd);
  }
}

export default class DataStore {
  private readonly requestFiles = new Map<string, RequestDataFile>();
  private workDir: string | undefined;

  async initialize() {
    if (this.workDir) throw new Error('OpenAPI DataStore already initialized');

    this.workDir = await mkdtemp(join(tmpdir(), 'appmap-openapi-'));
  }

  get requestFileNames(): string[] {
    return [...this.requestFiles.values()].map((requestFile) => requestFile.fileName);
  }

  async storeAppMap(appMapFile: string) {
    if (!this.workDir) throw new Error('OpenAPI DataStore not initialized');

    const data = await readFile(appMapFile, 'utf-8');
    const requests = new Array<Event>();
    parseHTTPServerRequests(JSON.parse(data), (e: Event) => requests.push(e));

    // This function is not async, so that the request files are opened atomically.
    const openRequestFile = (requestId: string): RequestDataFile => {
      let requestFile: RequestDataFile | undefined = this.requestFiles.get(requestId);
      if (!requestFile) {
        const workFile = Buffer.from(requestId).toString('base64');
        assert(this.workDir);
        const requestFileName = join(this.workDir, workFile);
        log(`Opening ${requestFileName} for ${requestId}`);
        const fd = openSync(requestFileName, 'w');
        requestFile = new RequestDataFile(fd, requestFileName);
        assert(!this.requestFiles.has(requestId));
        this.requestFiles.set(requestId, requestFile);
      }
      return requestFile;
    };

    for (const e of requests) {
      const request = rpcRequestForEvent(e);
      if (request) {
        const requestId = request.requestPath;
        const requestFile = openRequestFile(requestId);
        await requestFile.writeRequest(request);
      }
    }
  }

  async closeAll() {
    for (const [_, requestFile] of this.requestFiles) {
      await requestFile.close();
    }
  }

  async cleanup() {
    const { workDir } = this;
    if (!workDir) return;

    this.workDir = undefined;
    await rm(workDir, { recursive: true });
  }
}
