import chalk from 'chalk';
import assert from 'assert';
import EventEmitter from 'events';
import { ExplainRpc } from '@appland/rpc';
import { warn } from 'console';

import { RpcError, RpcHandler } from '../rpc';
import collectContext from './collectContext';
import INavie, { INavieProvider } from './navie/inavie';
import { verbose } from '../../utils';
import { Context, ProjectInfo } from '@appland/navie';
import loadAppMapConfig from '../../lib/loadAppMapConfig';
import { appmapStatsHandler } from '../appmap/stats';

const searchStatusByUserMessageId = new Map<string, ExplainRpc.ExplainStatusResponse>();

export type SearchContextOptions = {
  tokenCount: number;
  vectorTerms: string[];

  // Deprecated
  numSearchResults?: number;
  numDiagramsToAnalyze?: number;
};

export type SearchContextResponse = {
  sequenceDiagrams: string[];
  codeSnippets: { [key: string]: string };
  codeObjects: string[];
};

export const DEFAULT_TOKEN_LIMIT = 8000;

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
    let { tokenCount } = data;
    if (!tokenCount) {
      warn(chalk.bold(`Warning: tokenCount not set, defaulting to ${DEFAULT_TOKEN_LIMIT}`));
      tokenCount = DEFAULT_TOKEN_LIMIT;
    }

    this.status.vectorTerms = vectorTerms;

    this.status.step = ExplainRpc.Step.SEARCH_APPMAPS;

    // TODO: More accurate char limit? Probably doesn't matter because they will be
    // pruned by the client AI anyway.
    // The meaning of tokenCount is "try and get at least this many tokens"
    const charLimit = tokenCount * 3;
    const searchResult = await collectContext(this.appmapDir, this.appmaps, vectorTerms, charLimit);

    this.status.searchResponse = searchResult.searchResponse;

    this.status.step = ExplainRpc.Step.COLLECT_CONTEXT;

    this.status.sequenceDiagrams = searchResult.context.sequenceDiagrams;
    this.status.codeSnippets = Array.from<string>(searchResult.context.codeSnippets.keys()).reduce(
      (acc, key) => {
        const snippet = searchResult.context.codeSnippets.get(key);
        assert(snippet !== undefined);
        if (snippet) acc[key] = snippet;
        return acc;
      },
      {} as Record<string, string>
    );
    this.status.codeObjects = Array.from(searchResult.context.codeObjects);

    this.status.step = ExplainRpc.Step.EXPLAIN;

    return {
      sequenceDiagrams: this.status.sequenceDiagrams,
      codeSnippets: this.status.codeSnippets,
      codeObjects: this.status.codeObjects,
    };
  }

  async projectInfoContext(): Promise<ProjectInfo.ProjectInfoResponse> {
    const appmapConfig = (await loadAppMapConfig(this.appmapDir)) || {};
    const appmapStats: any = await appmapStatsHandler(this.appmapDir);
    delete appmapStats.classes; // This is verbose and I don't see the utility of it
    return Promise.resolve({
      'appmap.yml': appmapConfig,
      appmapStats: appmapStats,
    });
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

  const invokeContextFunction = async (data: any) => {
    const type = data['type'];
    const fnName = [type, 'Context'].join('');
    if (verbose()) warn(`Explain received context request: ${type}`);
    const fn: (args: any) => any = explain[fnName];
    return await fn.call(explain, data);
  };

  const contextProvider: Context.ContextProvider = async (data: any) => invokeContextFunction(data);
  const projectInfoProvider: ProjectInfo.ProjectInfoProvider = async (data: any) =>
    invokeContextFunction(data);

  const navie = navieProvider(threadId, contextProvider, projectInfoProvider);
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
