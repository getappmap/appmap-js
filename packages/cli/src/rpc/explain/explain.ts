import makeDebug from 'debug';

import {
  AI,
  ConversationThread,
  ModelParameters,
  ProjectDirectory,
  ProjectParameters,
} from '@appland/client';
import { ContextV2, Help, ProjectInfo, TestInvocation, UserContext } from '@appland/navie';
import { ExplainRpc } from '@appland/rpc';
import { warn } from 'console';
import EventEmitter from 'events';
import { basename } from 'path';

import { LRUCache } from 'lru-cache';
import detectAIEnvVar from '../../cmds/index/aiEnvVar';
import collectHelp from '../../cmds/navie/help';
import collectProjectInfos from '../../cmds/navie/projectInfo';
import configuration, { AppMapDirectory } from '../configuration';
import { getLLMConfiguration } from '../llmConfiguration';
import { RpcError, RpcHandler } from '../rpc';
import collectContext, { buildContextRequest } from './collect-context';
import INavie, { INavieProvider } from './navie/inavie';
import reportFetchError from './navie/report-fetch-error';
import handleReview from './review';
import { normalizePath } from './location';
import invokeTests from '../../cmds/navie/invokeTests';
import getInvocationStrategy from './invocation-strategy';

const searchStatusByUserMessageId = new Map<string, ExplainRpc.ExplainStatusResponse>();

const debug = makeDebug('appmap:explain:rpc');

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

export const DEFAULT_TOKEN_LIMIT = 12000;

export class Explain extends EventEmitter {
  conversationThread: ConversationThread | undefined;

  constructor(
    public appmapDirectories: AppMapDirectory[],
    public projectDirectories: string[],
    public question: string,
    public codeSelection: UserContext.Context | undefined,
    public appmaps: string[] | undefined,
    public status: ExplainRpc.ExplainStatusResponse,
    public codeEditor?: string,
    public prompt?: string
  ) {
    super();
  }

  async explain(navie: INavie): Promise<void> {
    navie.on('ack', (userMessageId, threadId) => {
      // threadId is now pre-allocated by the enrollConversationThread call
      // It may be falsey because errors in enrollConversationThread are logged but do not
      // block the rest of the procedure.
      if (!this.status.threadId) this.status.threadId = threadId;

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
      if (!this.status.err)
        this.status.err = {
          code: 'code' in err ? Number(err.code) : 500,
          message: err.message,
          stack: err.stack,
          cause: err.cause,
        };
      this.emit('error', err);
    });

    if (!this.status.threadId) {
      const thread = await reportFetchError('enrollConversationThread', () =>
        this.enrollConversationThread(navie)
      );
      if (thread) {
        this.conversationThread = thread;
        this.status.threadId = thread.id;
        if (!thread.permissions.useNavieAIProxy) {
          warn(
            `Use of Navie AI proxy is forbidden by your organization policy.\nYou can ignore this message if you're using your own AI API key or connecting to your own model.`
          );
        }
      }
    }

    await navie.ask(this.status.threadId, this.question, this.codeSelection, this.prompt);
  }

  async searchContext(data: ContextV2.ContextRequest): Promise<ContextV2.ContextResponse> {
    const { vectorTerms } = data;
    const { tokenCount } = data;

    this.status.vectorTerms = vectorTerms;

    if (data.labels) this.status.labels = data.labels;
    const labels = data.labels ?? [];

    const keywords = vectorTerms || [];
    if (keywords.length > 0) {
      if (
        labels.find(
          (label) =>
            label.name === ContextV2.ContextLabelName.Architecture &&
            label.weight === ContextV2.ContextLabelWeight.High
        ) ||
        labels.find(
          (label) =>
            label.name === ContextV2.ContextLabelName.Overview &&
            label.weight === ContextV2.ContextLabelWeight.High
        )
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
    }

    this.status.step = ExplainRpc.Step.SEARCH_APPMAPS;

    // TODO: More accurate char limit? Probably doesn't matter because they will be
    // pruned by the client AI anyway.
    // The meaning of tokenCount is "try and get at least this many tokens"
    const charLimit = tokenCount * 3;

    const contextRequest = buildContextRequest(
      this.appmapDirectories.map((dir) => dir.directory),
      this.projectDirectories,
      this.appmaps,
      keywords,
      charLimit,
      data
    );

    const explicitFiles = Array.isArray(this.codeSelection)
      ? this.codeSelection.filter(UserContext.hasLocation).map((cs) => cs.location)
      : [];

    const searchResult = await collectContext(
      this.appmapDirectories.map((dir) => dir.directory),
      this.projectDirectories,
      charLimit,
      contextRequest.vectorTerms,
      contextRequest.request,
      explicitFiles
    );

    this.status.searchResponse = searchResult.searchResponse;
    this.status.contextResponse = searchResult.context;

    this.status.step = ExplainRpc.Step.EXPLAIN;

    return searchResult.context;
  }

  async projectInfoContext(
    data: ProjectInfo.ProjectInfoRequest
  ): Promise<ProjectInfo.ProjectInfoResponse> {
    return await collectProjectInfos(this.codeEditor, data);
  }

  helpContext(data: Help.HelpRequest): Promise<Help.HelpResponse> {
    return collectHelp(data);
  }

  runTestContext(
    data: TestInvocation.TestInvocationRequest
  ): Promise<TestInvocation.TestInvocationResponse> {
    return invokeTests(getInvocationStrategy(), data);
  }

  async enrollConversationThread(navie: INavie): Promise<ConversationThread | undefined> {
    const modelParameters = {
      ...getLLMConfiguration(),
      provider: navie.providerName,
    } as ModelParameters;
    const aiKeyName = detectAIEnvVar();
    if (aiKeyName) modelParameters.aiKeyName = aiKeyName;

    const configurationDirectories = await configuration().appmapDirectories();
    const directories = configurationDirectories.map((dir) => {
      const result: ProjectDirectory = {
        hasAppMapConfig: dir.appmapConfig !== undefined,
      };
      if (dir.appmapConfig?.language) {
        result.language = dir.appmapConfig.language;
      }
      return result;
    });

    const projectParameters: ProjectParameters = {
      directoryCount: configurationDirectories.length,
      directories,
    };
    if (this.codeEditor) projectParameters.codeEditor = this.codeEditor;

    try {
      return await AI.createConversationThread({ modelParameters, projectParameters });
    } catch (err) {
      warn(`Failed to create conversation thread`);
      warn(err);
      return undefined;
    }
  }
}

const codeSelections = new LRUCache<string, UserContext.Context>({
  maxSize: 1024 ** 2 * 10 /* 10 MB */,
  sizeCalculation: (value) => {
    if (typeof value === 'string') {
      return value.length;
    }
    const size = value.reduce((a, v) => {
      let ret = v.type.length;
      if (UserContext.isCodeSelectionItem(v)) {
        ret += v.content.length;
      } else if (UserContext.isCodeSnippetItem(v)) {
        ret += v.content.length;
      }
      if (UserContext.hasLocation(v)) {
        ret += v.location.length;
      }
      return ret;
    }, 0);
    return size;
  },
});

export async function explain(
  navieProvider: INavieProvider,
  question: string,
  codeSelection: UserContext.Context | undefined,
  appmaps: string[] | undefined,
  threadId: string | undefined,
  codeEditor: string | undefined,
  prompt: string | undefined
): Promise<ExplainRpc.ExplainResponse> {
  debug('Code selection: ', codeSelection);

  const status: ExplainRpc.ExplainStatusResponse = {
    step: ExplainRpc.Step.NEW,
    threadId,
  };
  const appmapDirectories = await configuration().appmapDirectories();
  const { projectDirectories } = configuration();

  // Cached by thread ID or supplied via argument
  let cachedCodeSelection = codeSelection;
  if (!cachedCodeSelection && threadId) {
    cachedCodeSelection = codeSelections.get(threadId);
  }

  const explain = new Explain(
    appmapDirectories,
    projectDirectories,
    question,
    cachedCodeSelection,
    appmaps,
    status,
    codeEditor,
    prompt
  );

  const invokeContextFunction = async (data: any) => {
    const type = data.type as string;
    warn(`Explain received context request: ${type}`);
    const typeTokens = type.split('-');
    const firstTypeToken = typeTokens[0];
    const remainingTypeTokens = typeTokens
      .slice(1)
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1));
    const camelCaseType = [firstTypeToken, ...remainingTypeTokens].join('');
    const contextFunctionName = [camelCaseType, 'Context'].join('');
    warn(`Invoking context function : ${contextFunctionName}`);

    const fn: (args: any) => any = explain[contextFunctionName];
    if (!fn) {
      warn(`Explain context function ${contextFunctionName} not found`);
      return {};
    }

    try {
      return await fn.call(explain, data);
    } catch (e) {
      ``;
      warn(`Explain context function ${contextFunctionName} threw an error:`);
      warn(e);
      return {};
    }
  };

  const contextProvider: ContextV2.ContextProvider = async (data: any) =>
    invokeContextFunction(data);
  const projectInfoProvider: ProjectInfo.ProjectInfoProvider = async (data: any) =>
    invokeContextFunction(data);
  const helpProvider: Help.HelpProvider = async (data: any) => invokeContextFunction(data);
  const testInvocationProvider: TestInvocation.TestInvocationProvider = async (data: any) =>
    invokeContextFunction(data);

  const navie = navieProvider(
    contextProvider,
    projectInfoProvider,
    helpProvider,
    testInvocationProvider
  );
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
    explain.on('error', (err: Error) => first() && reject(err));
    explain.on('ack', (userMessageId: string, threadId: string) => {
      status.threadId = threadId;
      const cleanupFn = () => {
        const searchStatus = searchStatusByUserMessageId.get(userMessageId);
        if (searchStatus?.step != ExplainRpc.Step.COMPLETE) {
          console.error(
            `ERROR: Terminating request id ${userMessageId} before it was able to complete.`
          );
          console.error(JSON.stringify(searchStatus, null, 2));
        }
        searchStatusByUserMessageId.delete(userMessageId);
      };
      setTimeout(cleanupFn, 1000 * 60 * 5).unref();
      if (codeSelection) codeSelections.set(threadId, codeSelection);
      searchStatusByUserMessageId.set(userMessageId, status);
      first() && resolve({ userMessageId, threadId });
    });

    // If the request completes here, consider it an error. This would mean that the
    // remote server terminated our connection early.
    explain.on(
      'complete',
      () =>
        first() &&
        reject(new Error(status.explanation?.join('') ?? 'The response completed unexpectedly'))
    );

    explain.explain(navie).catch((err: Error) => first() && reject(err));
  });
}

export function explainStatus(userMessageId: string): ExplainRpc.ExplainStatusResponse {
  const searchStatus = searchStatusByUserMessageId.get(userMessageId);
  if (!searchStatus)
    throw new RpcError(
      404,
      `No search request with id \`${userMessageId}\`. Please check the log for details.`
    );
  return searchStatus;
}

const explainHandler: (
  navieProvider: INavieProvider,
  codeEditor: string | undefined
) => RpcHandler<ExplainRpc.ExplainOptions, ExplainRpc.ExplainResponse> = (
  navieProvider: INavieProvider,
  codeEditor: string | undefined
) => {
  return {
    name: ExplainRpc.ExplainFunctionName,
    handler: async (options: ExplainRpc.ExplainOptions) => {
      let userContext: UserContext.Context | undefined;
      if (options.codeSelection === undefined) {
        userContext = undefined;
      } else {
        if (typeof options.codeSelection === 'string') {
          userContext = options.codeSelection;
        } else {
          userContext = options.codeSelection.map((cs) => {
            return {
              type: cs.type,
              location: cs.location ? normalizePath(cs.location) : undefined,
              content: cs.content,
            } as UserContext.ContextItem;
          });
        }
      }

      const { applied, userContext: newUserContext } = await handleReview(
        options.question,
        userContext
      );
      if (applied) {
        userContext = newUserContext;
      }

      return await explain(
        navieProvider,
        options.question,
        userContext,
        options.appmaps,
        options.threadId,
        codeEditor,
        options.prompt
      );
    },
  };
};

const explainStatusHandler: () => RpcHandler<
  ExplainRpc.ExplainStatusOptions,
  ExplainRpc.ExplainStatusResponse
> = () => {
  return {
    name: ExplainRpc.ExplainStatusFunctionName,
    handler: (options: ExplainRpc.ExplainStatusOptions) => {
      return explainStatus(options.userMessageId);
    },
  };
};

export { explainHandler, explainStatusHandler };
