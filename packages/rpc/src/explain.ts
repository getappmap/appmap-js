import { SearchRpc } from './search';

export namespace ExplainRpc {
  export const ExplainFunctionName = 'explain';
  export const ExplainStatusFunctionName = 'explain.status';

  export type ExplainOptions = {
    threadId: string;
    question: string;
  };

  export type ExplainResponse = {
    requestId: string;
  };

  export type ExplainStatusOptions = {
    requestId: string;
  };

  export type PromptMessage = {
    content: string | undefined;
    role: 'function' | 'user' | 'system' | 'assistant' | 'tool';
  };

  export enum SearchStep {
    NEW = 'new',
    RUNNING = 'running',
    BUILD_VECTOR_TERMS = 'build-vector-terms',
    SEARCH_APPMAPS = 'search-appmaps',
    COLLECT_CONTEXT = 'collect-context',
    EXPAND_CONTEXT = 'expand-context',
    BUILD_PROMPT = 'build-prompt',
    EXPLAIN = 'explain',
    COMPLETE = 'complete',
    ERROR = 'error',
  }

  export type ExplainStatusResponse = {
    step: SearchStep;
    err?: Error | any | undefined;
    vectorTerms?: string[];
    searchResponse?: SearchRpc.SearchResponse;
    sequenceDiagrams?: string[];
    codeSnippets?: Record<string, string>;
    codeObjects?: string[];
    prompt?: PromptMessage[];
    explanation?: string[];
  };
}
