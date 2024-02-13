import { SearchRpc } from './search';

export namespace ExplainRpc {
  export const ExplainFunctionName = 'explain';
  export const ExplainStatusFunctionName = 'explain.status';

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
    threadId?: string;
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

  export type ExplainStatusResponse = {
    step: Step;
    threadId?: string;
    err?: Error | RpcError;
    classification?: string;
    vectorTerms?: string[];
    searchResponse?: SearchRpc.SearchResponse;
    sequenceDiagrams?: string[];
    codeSnippets?: Record<string, string>;
    codeObjects?: string[];
    explanation?: string[];
  };
}
