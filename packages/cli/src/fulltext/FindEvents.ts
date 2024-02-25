import { AppMap, AppMapFilter, Event, buildAppMap } from '@appland/models';
import { log, warn } from 'console';
import { readFile } from 'fs/promises';
import { verbose } from '../utils';
import lunr from 'lunr';
import { splitCamelized } from '../utils';
import { collectParameters } from './collectParameters';
import assert from 'assert';

type IndexItem = {
  fqid: string;
  name: string;
  location?: string;
  parameters: string[];
  eventIds: number[];
  elapsed?: number;
};

export class SearchOptions {
  constructor(public maxResults: number | undefined, public threshold: number | undefined) {
    if (!this.maxResults && !threshold) throw new Error('maxResults or threshold must be provided');
  }
}
export type SearchResult = {
  appmap: string;
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

export type SearchResponse = {
  type: 'event';
  results: SearchResult[];
  stats: Stats;
  numResults: number;
};

const MIN_MATCHES = 5;

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
        const name = splitCamelized(co.id);
        const item: IndexItem = {
          fqid: co.fqid,
          name,
          parameters,
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
    const self = this;
    this.idx = lunr(function () {
      this.ref('fqid');
      this.field('name');
      this.tokenizer.separator = /[\s/\-_:#.]+/;

      self.indexItemsByFqid.forEach((item) => {
        let boost = 1;
        if (item.location) boost += 1;
        if (item.eventIds.length > 1) boost += 1;
        this.add(item, { boost });
      });
    });
  }

  search(search: string, options: SearchOptions): SearchResponse {
    assert(this.idx);
    let matches = this.idx.search(search);
    const numResults = matches.length;
    if (verbose())
      log(
        `[FindEvents] Got ${numResults} event matches for search "${search}" within AppMap "${this.appmapId}`
      );
    if (!matches.length) {
      return {
        type: 'event',
        stats: { mean: 0, median: 0, stddev: 0, max: 0 },
        results: [],
        numResults,
      };
    }

    const mean = matches.reduce((acc, match) => acc + match.score, 0) / matches.length;
    const median = matches[Math.floor(matches.length / 2)].score;
    const stddev = Math.sqrt(
      matches.reduce((acc, match) => acc + Math.pow(match.score - mean, 2), 0) / matches.length
    );
    const max = matches.reduce((acc, match) => Math.max(acc, match.score), 0);
    const stats = {
      mean,
      median,
      stddev,
      max,
    };

    if (matches.
      length <= MIN_MATCHES) {
      if (verbose())
        log(
          `[FindEvents] Not enough matches to calculate threshold for search "${search}" within AppMap "${this.appmapId}"`
        );
    } else if (options.maxResults) {
      if (verbose())
        log(
          `[FindEvents] Limiting to the top ${options.maxResults} event matches within AppMap "${this.appmapId}"`
        );
      matches = matches.slice(0, options.maxResults);
    } else {
      assert(options.threshold);
      if (verbose())
        log(
          `[FindEvents] Limiting events to ${options.threshold} stddev above the mean within AppMap "${this.appmapId}"`
        );
      const limit = mean + stddev * options.threshold;

      matches = matches.filter((match) => match.score >= limit);
      if (matches.length === 0) matches = matches.slice(0, 1);
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

    return { type: 'event', stats, results: searchResults, numResults };
  }
}
