export type SearchOptions = {
  query: string;
  maxResults?: number;
};

export type EventResult = {
  fqid: string;
  location?: string;
  score: number;
  eventIds: number[];
  elapsed?: number;
};

export type SearchResult = {
  appmap: string;
  events: EventResult[];
  score: number;
};

export type SearchResponse = {
  results: SearchResult[];
  numResults: number;
};
