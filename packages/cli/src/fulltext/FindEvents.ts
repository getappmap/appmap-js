import { AppMap, AppMapFilter, Event, buildAppMap } from '@appland/models';
import { log, warn } from 'console';
import { readFile } from 'fs/promises';
import { verbose } from '../utils';
import lunr from 'lunr';
import { collectParameters } from './collectParameters';
import assert from 'assert';
import queryKeywords from './queryKeywords';

type IndexItem = {
  fqid: string;
  name: string[];
  location?: string;
  parameters: string[];
  eventIds: number[];
  elapsed?: number;
};

export type SearchOptions = {
  maxResults?: number;
};

export type SearchResult = {
  appmap: string;
  fqid: string;
  location?: string;
  score: number;
  eventIds: number[];
  elapsed?: number;
};

export type SearchResponse = {
  type: 'event';
  results: SearchResult[];
  numResults: number;
};

export default class FindEvents {
  public maxSize?: number;
  public filter?: AppMapFilter;

  idx: lunr.Index | undefined;
  indexItemsByFqid = new Map<string, IndexItem>();
  filteredAppMap?: AppMap;

  constructor(public appmapIndexDir: string) {}

  get appmapId() {
    return this.appmapIndexDir;
  }

  get appmap() {
    assert(this.filteredAppMap);
    return this.filteredAppMap;
  }

  async initialize() {
    const appmapFile = [this.appmapId, 'appmap.json'].join('.');
    const builder = buildAppMap().source(await readFile(appmapFile, 'utf-8'));
    if (this.maxSize) builder.prune(this.maxSize);

    const baseAppMap = builder.build();

    if (verbose()) log(`[FindEvents] Built AppMap with ${baseAppMap.events.length} events.`);

    let filteredAppMap: AppMap;
    if (this.filter) {
      if (verbose()) warn(`Applying custom AppMap filters.`);
      filteredAppMap = this.filter.filter(baseAppMap, []);
    } else {
      filteredAppMap = baseAppMap;
    }

    if (verbose()) log(`[FindEvents] Filtered AppMap has ${filteredAppMap.events.length} events.`);
    if (verbose()) log(`[FindEvents] Indexing events in AppMap ${this.appmapId}`);

    const indexEvent = (event: Event, depth = 0) => {
      const co = event.codeObject;
      const parameters = collectParameters(event);
      if (!this.indexItemsByFqid.has(co.fqid)) {
        const item: IndexItem = {
          fqid: co.fqid,
          name: queryKeywords(co.id),
          parameters: queryKeywords(parameters),
          // TODO: Transform the location into keywords, then restore as the original location path.
          // Currently, this field is not indexed.
          location: co.location,
          eventIds: [event.id],
        };
        if (event.elapsedTime) item.elapsed = event.elapsedTime;
        this.indexItemsByFqid.set(co.fqid, item);
      } else {
        const existing = this.indexItemsByFqid.get(co.fqid);
        if (existing) {
          existing.eventIds.push(event.id);
          if (event.elapsedTime) existing.elapsed = (existing.elapsed || 0) + event.elapsedTime;
          for (const parameter of parameters)
            if (!existing.parameters.includes(parameter)) existing.parameters.push(parameter);
        }
      }
      event.children.forEach((child) => indexEvent(child, depth + 1));
    };
    filteredAppMap.rootEvents().forEach((event) => indexEvent(event));

    this.filteredAppMap = filteredAppMap;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this.idx = lunr(function () {
      this.ref('fqid');
      this.field('name');
      this.field('parameters');
      this.tokenizer.separator = /[\s/\-_:#.]+/;

      self.indexItemsByFqid.forEach((item) => {
        let boost = 1;
        if (item.location) boost += 1;
        if (item.eventIds.length > 1) boost += 1;
        this.add(item, { boost });
      });
    });
  }

  search(search: string, options: SearchOptions = {}): SearchResponse {
    assert(this.idx);
    let matches = this.idx.search(queryKeywords(search).join(' '));
    const numResults = matches.length;
    if (verbose())
      log(
        `[FindEvents] Got ${numResults} event matches for search "${search}" within AppMap "${this.appmapId}`
      );
    if (options.maxResults && numResults > options.maxResults) {
      if (verbose())
        log(
          `[FindEvents] Limiting to the top ${options.maxResults} event matches within AppMap "${this.appmapId}"`
        );
      matches = matches.slice(0, options.maxResults);
    }
    const searchResults = matches.map((match) => {
      const indexItem = this.indexItemsByFqid.get(match.ref);
      assert(indexItem);
      const result: SearchResult = {
        appmap: this.appmapId,
        fqid: match.ref,
        score: match.score,
        elapsed: indexItem?.elapsed,
        eventIds: indexItem?.eventIds ?? [],
      };
      if (indexItem?.location) result.location = indexItem.location;
      return result;
    });
    return { type: 'event', results: searchResults, numResults };
  }
}
