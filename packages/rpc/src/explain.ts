import { SearchRpc } from './search';

export namespace ExplainRpc {
  export const ExplainFunctionName = 'explain';
  export const ExplainStatusFunctionName = 'explain.status';
  export const ExplainCommandsFunctionName = 'explain.commands';

  export enum Step {
    NEW = 'new',
    RUNNING = 'running',
    SEARCH_APPMAPS = 'search-appmaps',
    COLLECT_CONTEXT = 'collect-context',
    EXPLAIN = 'explain',
    COMPLETE = 'complete',
    ERROR = 'error',
  }

  export type ExplainOptions = {
    question: string;
    codeSelection?: string;
    appmaps?: string[];
    threadId?: string;
    prompt?: string;
  };

  export type ExplainResponse = {
    userMessageId: string;
    threadId: string;
  };

  export type ExplainStatusOptions = {
    userMessageId: string;
    threadId: string;
  };

  export type RpcError = {
    code: number;
    message: string;
    data?: object;
  };

  export type ContextItem = {
    type: string;
    content: string;
    location?: string;
    score?: number;
  };

  export type ContextLabel = {
    name: string;
    weight: string;
  };

  export type ExplainStatusResponse = {
    step: Step;
    threadId?: string;
    err?: Error | RpcError;
    vectorTerms?: string[];
    labels?: ContextLabel[];
    searchResponse?: SearchRpc.SearchResponse;
    contextResponse?: ContextItem[];
    explanation?: string[];
  };

  export type Command = {
    name: string;
    description: string;
    referenceUrl?: string;
    demoUrls?: string[];
  };

  export type ExplainCommandsOptions = {};

  export type ExplainCommandsResponse = {
    commands: Command[];
  };
}
