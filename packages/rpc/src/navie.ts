import { SearchRpc } from './search';

export namespace NavieRpc {
  export const AskFunctionName = 'navie.ask';
  export const StatusFunctionName = 'navie.status';

  export enum Step {
    NEW = 'new',
    RUNNING = 'running',
    SEARCH_APPMAPS = 'search-appmaps',
    COLLECT_CONTEXT = 'collect-context',
    EXPLAIN = 'explain',
    COMPLETE = 'complete',
    ERROR = 'error',
  }

  export type AIOptions = {
    tokenLimit?: number;
    modelName?: string;
    credential?: string;
  };

  export type Request = {
    question: string;
    codeSelection?: string;
    tool?: string;
    appmaps?: string[];
    threadId?: string;
    aiOptions?: AIOptions;
  };

  export type Response = {
    userMessageId: string;
    threadId: string;
  };

  export type StatusOptions = {
    userMessageId: string;
    threadId: string;
  };

  export type RpcError = {
    code: number;
    message: string;
    data?: object;
  };

  export type StatusResponse = {
    step: Step;
    tool?: string;
    threadId?: string;
    err?: Error | RpcError;
    completed?: boolean;
    vectorTerms?: string[];
    searchResponse?: SearchRpc.SearchResponse;
    sequenceDiagrams?: string[];
    codeSnippets?: Record<string, string>;
    codeObjects?: string[];
    explanation?: string[];
  };
}
