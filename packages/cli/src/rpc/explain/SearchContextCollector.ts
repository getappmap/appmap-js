import { log } from 'console';
import sqlite3 from 'better-sqlite3';

import { ContextV2, applyContext } from '@appland/navie';
import { SearchRpc } from '@appland/rpc';
import { FileIndex, FileSearchResult } from '@appland/search';

import { SearchResponse as AppMapSearchResponse } from '../../fulltext/appmap-match';
import { DEFAULT_MAX_DIAGRAMS } from '../search/search';
import EventCollector from './EventCollector';
import indexFiles from './index-files';
import indexSnippets from './index-snippets';
import collectSnippets from './collect-snippets';
import buildIndex from './buildIndex';
import { buildAppMapIndex, search } from '../../fulltext/appmap-index';

export default class SearchContextCollector {
  public excludePatterns: RegExp[] | undefined;
  public includePatterns: RegExp[] | undefined;
  public includeTypes: ContextV2.ContextItemType[] | undefined;

  constructor(
    private appmapDirectories: string[],
    private sourceDirectories: string[],
    private appmaps: string[] | undefined,
    private vectorTerms: string[],
    private charLimit: number
  ) {}

  async collectContext(): Promise<{
    searchResponse: SearchRpc.SearchResponse;
    context: ContextV2.ContextResponse;
  }> {
    let appmapSearchResponse: AppMapSearchResponse;
    if (this.appmaps) {
      const results = this.appmaps
        .map((appmap) => {
          const directory = this.appmapDirectories.find((dir) => appmap.startsWith(dir));
          if (!directory) return undefined;

          return {
            appmap,
            directory,
            score: 1,
          };
        })
        .filter(Boolean) as SearchRpc.SearchResult[];
      appmapSearchResponse = {
        type: 'appmap',
        stats: {
          max: 1,
          mean: 1,
          median: 1,
          stddev: 0,
        },
        results,
        numResults: this.appmaps.length,
      };
    } else {
      const appmapIndex = await buildIndex('appmaps', async (indexFile) => {
        const db = new sqlite3(indexFile);
        const fileIndex = new FileIndex(db);
        await buildAppMapIndex(fileIndex, this.appmapDirectories);
        return fileIndex;
      });
      const selectedAppMaps = await search(
        appmapIndex.index,
        this.vectorTerms.join(' OR '),
        DEFAULT_MAX_DIAGRAMS
      );
      appmapIndex.close();

      appmapSearchResponse = {
        results: selectedAppMaps.results,
        numResults: selectedAppMaps.results.length,
        stats: selectedAppMaps.stats,
        type: 'appmap',
      };

      log(`[search-context] Matched ${selectedAppMaps.results.length} AppMaps.`);
    }

    const fileIndex = await buildIndex('files', async (indexFile) => {
      const db = new sqlite3(indexFile);
      return await indexFiles(
        db,
        this.sourceDirectories,
        this.includePatterns,
        this.excludePatterns
      );
    });
    let fileSearchResults: FileSearchResult[];
    try {
      fileSearchResults = fileIndex.index.search(this.vectorTerms.join(' OR '));
    } finally {
      fileIndex.close();
    }

    const snippetIndex = await buildIndex('snippets', async (indexFile) => {
      const db = new sqlite3(indexFile);
      return await indexSnippets(db, fileSearchResults);
    });

    let contextCandidate: {
      results: SearchRpc.SearchResult[];
      context: ContextV2.ContextResponse;
      contextSize: number;
    };
    try {
      const eventsCollector = new EventCollector(this.vectorTerms.join(' '), appmapSearchResponse);

      let charCount = 0;
      let maxEventsPerDiagram = 5;
      log(`[search-context] Requested char limit: ${this.charLimit}`);
      for (;;) {
        log(`[search-context] Collecting context with ${maxEventsPerDiagram} events per diagram.`);

        contextCandidate = await eventsCollector.collectEvents(
          maxEventsPerDiagram,
          this.excludePatterns,
          this.includePatterns,
          this.includeTypes
        );

        const codeSnippetCount = contextCandidate.context.filter(
          (item) => item.type === ContextV2.ContextItemType.CodeSnippet
        ).length;

        const charLimit = codeSnippetCount === 0 ? this.charLimit : this.charLimit / 4;
        const sourceContext = collectSnippets(
          snippetIndex.index,
          this.vectorTerms.join(' OR '),
          charLimit
        );
        contextCandidate.context = contextCandidate.context.concat(sourceContext);

        const appliedContext = applyContext(contextCandidate.context, this.charLimit);
        const appliedContextSize = appliedContext.reduce(
          (acc, item) => acc + item.content.length,
          0
        );
        contextCandidate.context = appliedContext;
        contextCandidate.contextSize = appliedContextSize;
        log(`[search-context] Collected an estimated ${appliedContextSize} characters.`);

        if (appliedContextSize === charCount || appliedContextSize > this.charLimit) {
          break;
        }
        charCount = appliedContextSize;
        maxEventsPerDiagram = Math.ceil(maxEventsPerDiagram * 1.5);
        log(`[search-context] Increasing max events per diagram to ${maxEventsPerDiagram}.`);
      }
    } finally {
      snippetIndex.close();
    }

    return {
      searchResponse: {
        results: contextCandidate.results,
        numResults: appmapSearchResponse.numResults,
      },
      context: contextCandidate.context,
    };
  }
}
