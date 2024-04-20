import chalk from 'chalk';
import EventEmitter from 'events';
import { log, warn } from 'console';
import { ExplainRpc, SearchRpc } from '@appland/rpc';
import { ContextV2, Help, ProjectInfo } from '@appland/navie';

import { RpcError, RpcHandler } from '../rpc';
import collectContext from './collectContext';
import INavie, { INavieProvider } from './navie/inavie';
import configuration, { AppMapDirectory } from '../configuration';
import collectProjectInfos from '../../cmds/navie/projectInfo';
import collectHelp from '../../cmds/navie/help';
import { basename, join } from 'path';
import { link, mkdir, writeFile } from 'fs/promises';
import { dump } from 'js-yaml';

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
  codeSnippets: Record<string, string>;
  codeObjects: string[];
};

export const DEFAULT_TOKEN_LIMIT = 8000;

export class Explain extends EventEmitter {
  private userMessageId: string | undefined;

  constructor(
    public appmapDirectories: AppMapDirectory[],
    public projectDirectories: string[],
    public question: string,
    public codeSelection: string | undefined,
    public appmaps: string[] | undefined,
    public status: ExplainRpc.ExplainStatusResponse
  ) {
    super();
  }

  async explain(navie: INavie): Promise<void> {
    navie.on('ack', (userMessageId, threadId) => {
      this.status.threadId = threadId;
      this.userMessageId = userMessageId;
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

  async searchContext(
    contextRequest: ContextV2.ContextRequest
  ): Promise<ContextV2.ContextResponse> {
    let { vectorTerms } = contextRequest;
    let { tokenCount } = contextRequest;

    this.status.vectorTerms = vectorTerms;

    if (contextRequest.labels) this.status.labels = contextRequest.labels;
    const labels = contextRequest.labels || [];

    if (!tokenCount) {
      warn(chalk.bold(`Warning: Token limit not set, defaulting to ${DEFAULT_TOKEN_LIMIT}`));
      tokenCount = DEFAULT_TOKEN_LIMIT;
    }
    if (!vectorTerms || vectorTerms.length === 0) {
      warn(chalk.bold(`Warning: No keywords provided, context result may be unpredictable`));
    }

    const keywords = [...vectorTerms];
    if (
      labels.find((label) => label.name === 'architecture') ||
      labels.find((label) => label.name === 'overview')
    ) {
      keywords.push('architecture');
      keywords.push('design');
      keywords.push('readme');
      keywords.push('about');
      keywords.push('overview');
      for (const dir of this.projectDirectories) {
        keywords.push(basename(dir));
      }
    }
    // TODO: For 'troubleshoot', include log information

    this.status.step = ExplainRpc.Step.SEARCH_APPMAPS;

    // TODO: More accurate char limit? Probably doesn't matter because they will be
    // pruned by the client AI anyway.
    // The meaning of tokenCount is "try and get at least this many tokens"
    const charLimit = tokenCount * 3;
    const searchResult = await collectContext(
      this.appmapDirectories.map((dir) => dir.directory),
      this.projectDirectories,
      this.appmaps,
      keywords,
      charLimit
    );

    await this.logContext(contextRequest, keywords, searchResult);

    this.status.searchResponse = searchResult.searchResponse;
    this.status.contextResponse = searchResult.context;

    this.status.step = ExplainRpc.Step.EXPLAIN;

    return searchResult.context;
  }

  projectInfoContext(): Promise<ProjectInfo.ProjectInfoResponse> {
    return collectProjectInfos();
  }

  helpContext(data: Help.HelpRequest): Promise<Help.HelpResponse> {
    return collectHelp(data);
  }

  async logContext(
    request: ContextV2.ContextRequest,
    keywords: string[],
    searchResult: {
      searchResponse: SearchRpc.SearchResponse;
      context: ContextV2.ContextResponse;
    }
  ) {
    const contextDir = join(
      ...([process.env.HOME, '.appmap', 'navie', 'context'].filter(Boolean) as string[])
    );
    await mkdir(contextDir, { recursive: true });

    const contextTimestampFile = join(contextDir, [Date.now().toString(), 'yml'].join('.'));
    const message = dump({
      threadId: this.status.threadId,
      messageId: this.userMessageId,
      question: this.question,
      codeSelection: this.codeSelection,
      request: request,
      keywords: keywords,
      searchResponse: searchResult.searchResponse,
      context: searchResult.context,
    });
    await writeFile(contextTimestampFile, message, 'utf8');
    log(`Wrote context to ${contextTimestampFile}`);

    if (this.userMessageId) {
      const messageIdDir = join(contextDir, 'messageId');
      await mkdir(messageIdDir, { recursive: true });
      const contextMessageIdFile = join(messageIdDir, [this.userMessageId, 'yml'].join('.'));
      try {
        await link(contextTimestampFile, contextMessageIdFile);
        log(`Linked context file ${contextTimestampFile} to ${contextMessageIdFile}`);
      } catch (err) {
        console.error(`Failed to link context file ${contextTimestampFile}: ${err}`);
      }
    }
  }
}

async function explain(
  navieProvider: INavieProvider,
  question: string,
  codeSelection: string | undefined,
  appmaps: string[] | undefined,
  threadId: string | undefined
): Promise<ExplainRpc.ExplainResponse> {
  const status: ExplainRpc.ExplainStatusResponse = {
    step: ExplainRpc.Step.NEW,
    threadId,
  };
  const appmapDirectories = await configuration().appmapDirectories();
  const { projectDirectories } = configuration();
  const explain = new Explain(
    appmapDirectories,
    projectDirectories,
    question,
    codeSelection,
    appmaps,
    status
  );

  const invokeContextFunction = async (data: any) => {
    const type = data['type'];
    const fnName = [type, 'Context'].join('');
    warn(`Explain received context request: ${type}`);
    const fn: (args: any) => any = explain[fnName];
    if (!fn) {
      warn(`Explain context function ${fnName} not found`);
      return {};
    }

    try {
      return await fn.call(explain, data);
    } catch (e) {
      warn(`Explain context function ${fnName} threw an error:`);
      warn(e);
      return {};
    }
  };

  const contextProvider: ContextV2.ContextProvider = async (data: any) =>
    invokeContextFunction(data);
  const projectInfoProvider: ProjectInfo.ProjectInfoProvider = async (data: any) =>
    invokeContextFunction(data);
  const helpProvider: Help.HelpProvider = async (data: any) => invokeContextFunction(data);

  const navie = navieProvider(threadId, contextProvider, projectInfoProvider, helpProvider);
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
  navieProvider: INavieProvider
) => RpcHandler<ExplainRpc.ExplainOptions, ExplainRpc.ExplainResponse> = (
  navieProvider: INavieProvider
) => {
  return {
    name: ExplainRpc.ExplainFunctionName,
    handler: async (options: ExplainRpc.ExplainOptions) =>
      await explain(
        navieProvider,
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
