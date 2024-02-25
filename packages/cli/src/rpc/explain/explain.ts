import assert from 'assert';
import { ExplainRpc } from '@appland/rpc';

import search from './search';
import context from './context';
import { RpcError, RpcHandler } from '../rpc';
import EventEmitter from 'events';
import INavie, { ContextProvider, INavieProvider } from './navie/inavie';
import { verbose } from '../../utils';
import { warn } from 'console';

const searchStatusByUserMessageId = new Map<string, ExplainRpc.ExplainStatusResponse>();

export type SearchContextOptions = {
  tokenLimit: number;
  vectorTerms: string[];
};

export type SearchContextResponse = {
  sequenceDiagrams: string[];
  codeSnippets: { [key: string]: string };
  codeObjects: string[];
};

export class Explain extends EventEmitter {
  constructor(
    public appmapDir: string,
    public question: string,
    public codeSelection: string | undefined,
    public appmaps: string[] | undefined,
    public status: ExplainRpc.ExplainStatusResponse
  ) {
    super();
  }

  async explain(navie: INavie): Promise<void> {
    const self = this;

    navie.on('ack', (userMessageId, threadId) => {
      this.status.threadId = threadId;
      this.emit('ack', userMessageId, threadId);
    });
    navie.on('token', (token, _messageId) => {
      this.status.explanation ||= [];
      this.status.explanation.push(token);
    });
    navie.on('complete', () => {
      this.status.step = ExplainRpc.Step.COMPLETE;
      this.emit('complete');
    });
    navie.on('error', (err: Error) => {
      this.status.step = ExplainRpc.Step.ERROR;
      const rpcError = RpcError.fromException(err);
      if (!this.status.err)
        this.status.err = {
          code: rpcError.code,
          message: rpcError.message,
          stack: err.stack,
          cause: err.cause,
        };
      this.emit('error', rpcError);
    });
    await navie.ask(this.question, this.codeSelection);
  }

  async searchContext(data: SearchContextOptions): Promise<SearchContextResponse> {
    const { vectorTerms } = data;

    this.status.vectorTerms = vectorTerms;

    this.status.step = ExplainRpc.Step.SEARCH_APPMAPS;

    const searchResponse = await search(this.appmapDir, vectorTerms);
    this.status.searchResponse = searchResponse;
    this.status.step = ExplainRpc.Step.COLLECT_CONTEXT;

    const contextStepResponse = await context(searchResponse);

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
  navieProvider: INavieProvider,
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

  const contextProvider: ContextProvider = async (data: any): Promise<Record<string, string>> => {
    const type = data['type'];
    const fnName = [type, 'Context'].join('');
    if (verbose()) warn(`Explain received context request: ${type}`);
    const fn: (args: any) => any = explain[fnName];
    return await fn.call(explain, data);
  };

  const navie = navieProvider(threadId, contextProvider);

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
    explain.explain(navie).catch((err: Error) => first() && reject(RpcError.fromException(err)));
  });
}

const explainHandler: (
  navieProvider: INavieProvider,
  appmapDir: string
) => RpcHandler<ExplainRpc.ExplainOptions, ExplainRpc.ExplainResponse> = (
  navieProvider: INavieProvider,
  appmapDir: string
) => {
  return {
    name: ExplainRpc.ExplainFunctionName,
    handler: async (options: ExplainRpc.ExplainOptions) =>
      await explain(
        navieProvider,
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
