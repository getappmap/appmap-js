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
    threadId?: string;
  };

  export type ExplainResponse = {
    userMessageId: string;
  };

  export type ExplainStatusOptions = {
    userMessageId: string;
    threadId: string;
  };

  export type ExplainStatusResponse = {
    step: Step;
    threadId?: string;
    err?: Error | any | undefined;
    vectorTerms?: string[];
    searchResponse?: SearchRpc.SearchResponse;
    sequenceDiagrams?: string[];
    codeSnippets?: Record<string, string>;
    codeObjects?: string[];
    explanation?: string[];
  };
}
