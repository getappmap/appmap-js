export namespace SearchRpc {
  export const FunctionName = 'search';

  export type SearchOptions = {
    appmaps?: string[];
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

  export type Stats = {
    mean: number;
    median: number;
    stddev: number;
    max: number;
  };

  export type SearchResult = {
    appmap: string;
    events: EventMatch[];
    eventStats: Stats;
    score: number;
  };

  export type SearchResponse = {
    results: SearchResult[];
    searchStats: Stats;
    numResults: number;
  };
}
