import { ConfigurationRpc } from './configuration';
import { SearchRpc } from './search';

export namespace ExplainRpc {
  export const ExplainFunctionName = 'explain';
  export const ExplainStatusFunctionName = 'explain.status';
  export const ExplainThreadLoadFunctionName = 'explain.thread.load';

  export enum Step {
    NEW = 'new',
    RUNNING = 'running',
    SEARCH_APPMAPS = 'search-appmaps',
    COLLECT_CONTEXT = 'collect-context',
    EXPLAIN = 'explain',
    COMPLETE = 'complete',
    ERROR = 'error',
  }

  export type UserContextItem = {
    // These types needs to match those specified in ContextV2.ContextItemType
    type: 'code-selection' | 'code-snippet' | 'file';
    location?: string;
    content?: string;
  };

  export type ExplainOptions = {
    question: string;
    codeSelection?: string | UserContextItem[];
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

  export type Message = {
    messageId: string;
    content: string;
    role: 'user' | 'assistant';
  };

  export type Question = Message & {
    role: 'user';
    timestamp: number;
    codeSelection?: string;
    prompt?: string;
  };

  export type Answer = Message & {
    role: 'assistant';
  };

  export type Exchange = {
    question: Question;
    answer?: Answer;
  };

  export type Thread = {
    timestamp: number;
    projectDirectories: string[];
    exchanges: Exchange[];
  };

  export type LoadThreadOptions = {
    threadId: string;
  };

  export type LoadThreadResponse = Thread;
}
