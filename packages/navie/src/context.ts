export type ContextRequest = {
  type: 'search';
  vectorTerms: string[];
  tokenCount: number;
};

export type SampleContextRequest = {
  type: 'sample';
  tokenCount: number;
};

export type ContextItem = {
  name: string;
  score?: number;
  content: string;
};

export type ContextResponse = {
  sequenceDiagrams: string[];
  codeSnippets: { [key: string]: string };
  codeObjects: string[];
};

export type ContextProvider = (request: ContextRequest) => Promise<ContextResponse>;

export type SampleContextProvider = (request: SampleContextRequest) => Promise<ContextResponse>;
