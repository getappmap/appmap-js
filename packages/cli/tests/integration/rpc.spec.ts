import assert from 'assert';
import { warn } from 'console';
import jayson from 'jayson/promise';
import { AppMapRpc, ExplainRpc, IndexRpc, SearchRpc } from '@appland/rpc';
import { join } from 'path';
import { AppMapFilter, serializeFilter } from '@appland/models';
import { readFile } from 'fs/promises';
import { AI } from '@appland/client';
import { AIClient, AICallbacks, AIInputPromptOptions } from '@appland/client';

import RPCServer from '../../src/cmds/index/rpcServer';
import FingerprintWatchCommand from '../../src/fingerprint/fingerprintWatchCommand';
import { RpcHandler } from '../../src/rpc/rpc';
import { numProcessed } from '../../src/rpc/index/numProcessed';
import { search } from '../../src/rpc/search/search';
import appmapData from '../../src/rpc/appmap/data';
import metadata from '../../src/rpc/appmap/metadata';
import sequenceDiagram from '../../src/rpc/appmap/sequenceDiagram';
import {
  SearchContextOptions,
  explainHandler,
  explainStatusHandler,
} from '../../src/rpc/explain/explain';

type RpcResponse<T> = {
  error?: { code: number; message: string };
  id: number;
  jsonrpc: string;
  result?: T;
};

async function waitFor(condition: () => Promise<boolean> | boolean, timeout = 2000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Timeout');
}

describe('RPC server', () => {
  let workingDir: string;
  let rpcServer: RPCServer | undefined;

  let fingerprintWatchCommand = {
    numProcessed: 0,
  } as FingerprintWatchCommand;

  const hideExternalFilterState = () => {
    const filter = new AppMapFilter();
    filter.declutter.hideExternalPaths.on = true;
    return serializeFilter(filter);
  };

  const handlers: RpcHandler<any, any>[] = [
    numProcessed(fingerprintWatchCommand),
    search('.'),
    appmapData(),
    metadata(),
    sequenceDiagram(),
    explainHandler('.'),
    explainStatusHandler(),
  ];

  function rpcClient(): jayson.Client {
    assert(rpcServer);
    assert(rpcServer.port);
    return jayson.Client.http({ port: rpcServer.port });
  }

  beforeAll(async () => {
    workingDir = process.cwd();
    process.chdir(join(__dirname, '../unit/fixtures/ruby'));

    rpcServer = new RPCServer(0, handlers);
    rpcServer.start();
    rpcServer.unref();
    await waitFor(() => rpcServer?.port !== undefined);
  });

  afterAll(() => (rpcServer ? rpcServer.stop() : undefined));
  afterAll(() => process.chdir(workingDir));

  describe('non-existent method', () => {
    it('returns an error', async () => {
      const result = await rpcClient().request('nonexistent', []);
      expect(Object.keys(result).sort()).toEqual(['error', 'id', 'jsonrpc']);
      expect(result.error).toEqual({ code: -32601, message: 'Method not found' });
    });
  });

  describe('index.numProcessed', () => {
    it('is initially 0', async () => {
      const result: RpcResponse<IndexRpc.NumProcessedResponse> = await rpcClient().request(
        IndexRpc.NumProcessedFunctionName,
        []
      );

      expect(result.result).toEqual(0);
    });
  });

  describe('appmap.metadata', () => {
    it('can be retrieved', async () => {
      const options: AppMapRpc.MetadataOptions = {
        appmap: 'revoke_api_key.appmap.json',
      };
      const response = await rpcClient().request(AppMapRpc.MetadataFunctionName, options);
      expect(response.error).toBeFalsy();
      const metadata = response.result;
      expect(metadata.name).toEqual('API::APIKeysController revoke an existing api key');
    });
  });

  describe('appmap.data', () => {
    const eventCount = 42;
    const filteredEventCount = 40;

    it('can be retrieved', async () => {
      const options: AppMapRpc.FilterOptions = {
        appmap: 'revoke_api_key.appmap.json',
      };
      const response = await rpcClient().request(AppMapRpc.DataFunctionName, options);
      expect(response.error).toBeFalsy();
      const data = response.result;
      expect(data.metadata.name).toEqual('API::APIKeysController revoke an existing api key');
      expect(data.events.length).toEqual(eventCount);
    });

    it('can be filtered', async () => {
      const options: AppMapRpc.FilterOptions = {
        appmap: 'revoke_api_key.appmap.json',
        filter: hideExternalFilterState(),
      };
      const response = await rpcClient().request(AppMapRpc.DataFunctionName, options);
      expect(response.error).toBeFalsy();
      const data = response.result;
      expect(data.events.length).toEqual(filteredEventCount);
    });
  });

  describe('appmap.sequenceDiagram', () => {
    it('can be retrieved', async () => {
      const options: AppMapRpc.SequenceDiagramOptions = {
        appmap: 'revoke_api_key.appmap.json',
      };
      const response = await rpcClient().request(AppMapRpc.SequenceDiagramFunctionName, options);
      expect(response.error).toBeFalsy();
      const diagramData = response.result;
      expect(diagramData).toEqual(
        JSON.parse(
          await readFile(join(__dirname, 'fixtures', 'sequenceDiagram', 'diagram.json'), 'utf-8')
        )
      );
    });

    it('can be filtered', async () => {
      const options: AppMapRpc.SequenceDiagramOptions = {
        appmap: 'revoke_api_key.appmap.json',
        filter: hideExternalFilterState(),
        diagramOptions: { loops: false },
        format: 'plantuml',
        formatOptions: { disableMarkup: true },
      };
      const response = await rpcClient().request(AppMapRpc.SequenceDiagramFunctionName, options);
      expect(response.error).toBeFalsy();
      const diagramData = response.result;
      expect(diagramData).toEqual(
        await readFile(
          join(__dirname, 'fixtures', 'sequenceDiagram', 'diagram.filtered.uml'),
          'utf-8'
        )
      );
    });
  });

  describe('search', () => {
    it('finds AppMaps by keyword', async () => {
      const options: SearchRpc.SearchOptions = {
        query: 'api key',
        maxResults: 3,
      };
      const response = await rpcClient().request(SearchRpc.FunctionName, options);
      expect(response.error).toBeFalsy();
      const searchData = response.result;
      expect(searchData).toEqual(
        JSON.parse(
          await readFile(join(__dirname, 'fixtures', 'search', 'api_key.search.json'), 'utf-8')
        )
      );
    });
  });

  describe('explain', () => {
    it(
      'coordinates with the remote server to answer a question',
      async () => {
        const question = 'How is the API key verified?';
        const answer = `A useful explanation of API key verification`;
        const threadId = 'the-thread-id';
        const userMessageId = 'the-user-message-id';

        class MockAIClient {
          constructor(public callbacks: AICallbacks) {}

          async inputPrompt(input: string, options?: AIInputPromptOptions): Promise<void> {
            expect(input).toEqual(question);
            expect(options?.tool).toEqual('explain');
            this.callbacks.onAck!(userMessageId, threadId);

            const searchContextOptions: SearchContextOptions = {
              vectorTerms: ['api', 'key'],
              tokenLimit: 4000,
              numSearchResults: 1,
              numDiagramsToAnalyze: 1,
            };

            const context = await this.callbacks.onRequestContext!({
              ...{ type: 'search' },
              ...searchContextOptions,
            });
            expect(Object.keys(context).sort()).toEqual([
              'codeObjects',
              'codeSnippets',
              'sequenceDiagrams',
            ]);

            setTimeout(() => {
              this.callbacks.onToken!(answer, userMessageId);
            }, 0);

            setTimeout(() => {
              this.callbacks.onComplete!();
            }, 0);
          }
        }

        const aiClient = (callbacks: AICallbacks): AIClient => {
          return new MockAIClient(callbacks) as unknown as AIClient;
        };

        jest
          .spyOn(AI, 'connect')
          .mockImplementation((callbacks: AICallbacks) => Promise.resolve(aiClient(callbacks)));

        const explainOptions: ExplainRpc.ExplainOptions = {
          question,
        };
        const explainResponse = await rpcClient().request(
          ExplainRpc.ExplainFunctionName,
          explainOptions
        );
        expect(explainResponse.error).toBeFalsy();
        const explainResult: ExplainRpc.ExplainResponse = explainResponse.result;
        expect(explainResult.userMessageId).toEqual(userMessageId);

        const queryStatus = async (): Promise<ExplainRpc.ExplainStatusResponse> => {
          const statusOptions: ExplainRpc.ExplainStatusOptions = {
            userMessageId,
            threadId,
          };
          const statusResponse = await rpcClient().request(
            ExplainRpc.ExplainStatusFunctionName,
            statusOptions
          );
          expect(statusResponse.error).toBeFalsy();
          const statusResult: ExplainRpc.ExplainStatusResponse = statusResponse.result;
          return statusResult;
        };

        await waitFor(async () => (await queryStatus()).step === ExplainRpc.Step.COMPLETE);

        const statusResult = await queryStatus();
        const sequenceDiagrams = statusResult.sequenceDiagrams;
        expect(sequenceDiagrams?.join('\n')).toContain('@startuml');
        expect(Object.keys(statusResult)).toContain('codeObjects');
        expect(Object.keys(statusResult)).toContain('codeSnippets');
        expect(Object.keys(statusResult)).toContain('searchResponse');
        expect(statusResult.searchResponse?.numResults).toBeTruthy();

        for (const key of ['sequenceDiagrams', 'codeObjects', 'codeSnippets', 'searchResponse'])
          delete statusResult[key];

        expect(statusResult).toEqual({
          step: ExplainRpc.Step.COMPLETE,
          threadId,
          vectorTerms: ['api', 'key'],
          explanation: [answer],
        });
      },
      1000 * 10 // Allow this test to run a bit longer
    );
  });
});
