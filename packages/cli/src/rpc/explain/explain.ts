import { AI } from '@appland/client';
import { ExplainRpc } from '@appland/rpc';
import { RpcError, RpcHandler, errorMessage, isRpcError } from '../rpc';

const searchStatusByUserMessageId = new Map<string, ExplainRpc.ExplainStatusResponse>();

import EventEmitter from 'events';
import search from './search';
import context from './context';
import assert from 'assert';
import { warn } from 'console';
import { verbose } from '../../utils';

export type SearchContextOptions = {
  tokenLimit: number;
  vectorTerms: string[];
  numSearchResults?: number;
  numDiagramsToAnalyze?: number;
};

export type SearchContextResponse = {
  sequenceDiagrams: string[];
  codeSnippets: { [key: string]: string };
  codeObjects: string[];
};

export default class Explain extends EventEmitter {
  constructor(
    public appmapDir: string,
    public question: string,
    public codeSelection: string | undefined,
    public appmaps: string[] | undefined,
    public status: ExplainRpc.ExplainStatusResponse
  ) {
    super();
  }

  async explain(): Promise<void> {
    const self = this;
    (
      await AI.connect({
        onAck(userMessageId, threadId) {
          if (verbose())
            warn(`Explain received ack (userMessageId=${userMessageId}, threadId=${threadId})`);
          self.status.threadId = threadId;
          self.emit('ack', userMessageId, threadId);
        },
        onToken(token, _messageId) {
          self.status.explanation ||= [];
          self.status.explanation.push(token);
        },
        async onRequestContext(data) {
          const type = data['type'];
          const fnName = [type, 'Context'].join('');
          if (verbose()) warn(`Explain received context request: ${type}`);
          const fn: (args: any) => any = self[fnName];
          return await fn.call(self, data);
        },
        onComplete() {
          if (verbose()) warn(`Explain is complete`);
          self.status.step = ExplainRpc.Step.COMPLETE;
          self.emit('complete');
        },
        onError(err: Error) {
          if (verbose()) warn(`Error handled by Explain: ${err}`);
          self.status.step = ExplainRpc.Step.ERROR;
          const rpcError = RpcError.fromException(err);
          if (!self.status.err)
            self.status.err = {
              code: rpcError.code,
              message: rpcError.message,
              stack: err.stack,
              cause: err.cause,
            };
          self.emit('error', rpcError);
        },
      })
    ).inputPrompt(
      { question: this.question, codeSelection: this.codeSelection },
      { threadId: self.status.threadId, tool: 'explain' }
    );
  }

  async searchContext(data: SearchContextOptions): Promise<SearchContextResponse> {
    const { vectorTerms } = data;
    let { numSearchResults, numDiagramsToAnalyze } = data;
    if (!numSearchResults) numSearchResults = 10;
    if (!numDiagramsToAnalyze) numDiagramsToAnalyze = 3;

    this.status.vectorTerms = vectorTerms;

    this.status.step = ExplainRpc.Step.SEARCH_APPMAPS;

    const searchResponse = await search(
      this.appmapDir,
      this.appmaps,
      vectorTerms,
      numSearchResults
    );
    this.status.searchResponse = searchResponse;
    this.status.step = ExplainRpc.Step.COLLECT_CONTEXT;

    const contextStepResponse = await context(searchResponse, numDiagramsToAnalyze);

    this.status.sequenceDiagrams = contextStepResponse.sequenceDiagrams;
    this.status.codeSnippets = Array.from<string>(contextStepResponse.codeSnippets.keys()).reduce(
      (acc, key) => {
        const snippet = contextStepResponse.codeSnippets.get(key);
        assert(snippet !== undefined);
        if (snippet) acc[key] = snippet;
        return acc;
      },
      {} as Record<string, string>
    );
    this.status.codeObjects = Array.from(contextStepResponse.codeObjects);

    this.status.step = ExplainRpc.Step.EXPLAIN;

    return {
      sequenceDiagrams: this.status.sequenceDiagrams,
      codeSnippets: this.status.codeSnippets,
      codeObjects: this.status.codeObjects,
    };
  }
}

async function explain(
  appmapDir: string,
  question: string,
  codeSelection: string | undefined,
  appmaps: string[] | undefined,
  threadId: string | undefined
): Promise<ExplainRpc.ExplainResponse> {
  const status: ExplainRpc.ExplainStatusResponse = {
    step: ExplainRpc.Step.NEW,
    threadId,
  };
  const explain = new Explain(appmapDir, question, codeSelection, appmaps, status);
  return new Promise<ExplainRpc.ExplainResponse>((resolve, reject) => {
    let isFirst = true;

    const first = (): boolean => {
      if (isFirst) {
        isFirst = false;
        return true;
      }

      return false;
    };

    // TODO: These could be collected into status errors
    explain.on('error', (err: Error) => first() && reject(RpcError.fromException(err)));
    explain.on('ack', (userMessageId: string, threadId: string) => {
      status.threadId = threadId;
      const cleanupFn = () => searchStatusByUserMessageId.delete(userMessageId);
      setTimeout(cleanupFn, 1000 * 60 * 5).unref();
      searchStatusByUserMessageId.set(userMessageId, status);
      first() && resolve({ userMessageId, threadId });
    });

    // If the request completes here, consider it an error. This would mean that the
    // remote server terminated our connection early.
    explain.on(
      'complete',
      () =>
        first() &&
        reject(
          RpcError.fromException(
            new Error(status.explanation?.join('') || 'The response completed unexpectedly')
          )
        )
    );

    explain.explain().catch((err: Error) => first() && reject(RpcError.fromException(err)));
  });
}

const explainHandler: (
  appmapDir: string
) => RpcHandler<ExplainRpc.ExplainOptions, ExplainRpc.ExplainResponse> = (appmapDir: string) => {
  return {
    name: ExplainRpc.ExplainFunctionName,
    handler: async (options: ExplainRpc.ExplainOptions) =>
      await explain(
        appmapDir,
        options.question,
        options.codeSelection,
        options.appmaps,
        options.threadId
      ),
  };
};

const explainStatusHandler: () => RpcHandler<
  ExplainRpc.ExplainStatusOptions,
  ExplainRpc.ExplainStatusResponse
> = () => {
  return {
    name: ExplainRpc.ExplainStatusFunctionName,
    handler: async (options: ExplainRpc.ExplainStatusOptions) => {
      const searchStatus = searchStatusByUserMessageId.get(options.userMessageId);
      if (!searchStatus)
        throw new RpcError(404, `No search request with id ${options.userMessageId}`);
      return searchStatus;
    },
  };
};

export { explainHandler, explainStatusHandler };
