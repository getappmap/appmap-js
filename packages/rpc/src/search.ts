export namespace SearchRpc {
  export const FunctionName = 'search';

  export type SearchOptions = {
    query: string;
    maxResults?: number;
  };

  export type EventMatch = {
    fqid: string;
    location?: string;
    score: number;
    eventIds: number[];
    elapsed?: number;
  };

  export type SearchResult = {
    appmap: string;
    events: EventMatch[];
    score: number;
  };

  export type SearchResponse = {
    results: SearchResult[];
    numResults: number;
  };
}
