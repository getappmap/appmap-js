import { log, warn } from 'console';
import sqlite3 from 'better-sqlite3';

import { ContextV2, applyContext } from '@appland/navie';
import { SearchRpc } from '@appland/rpc';
import { FileIndex, FileSearchResult, SnippetSearchResult } from '@appland/search';

import { SearchResponse as AppMapSearchResponse } from '../../fulltext/appmap-match';
import { DEFAULT_MAX_DIAGRAMS } from '../search/search';
import indexFiles from './index-files';
import indexSnippets from './index-snippets';
import buildIndex from './buildIndex';
import { buildAppMapIndex, search } from '../../fulltext/appmap-index';
import indexEvents from './index-events';

type ContextCandidate = {
  results: SearchRpc.SearchResult[];
  context: ContextV2.ContextResponse;
  contextSize: number;
};

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
      const snippetIndex = await indexSnippets(db, fileSearchResults);
      await indexEvents(snippetIndex, appmapSearchResponse.results);
      return snippetIndex;
    });

    let contextCandidate: ContextCandidate;
    try {
      let charCount = 0;
      let maxSnippets = 50;
      log(`[search-context] Requested char limit: ${this.charLimit}`);
      for (;;) {
        log(`[search-context] Collecting context with ${maxSnippets} events per diagram.`);

        // Collect all code objects from AppMaps and use them to build the sequence diagram
        // const codeSnippets = new Array<SnippetSearchResult>();
        // TODO: Apply this.includeTypes

        const snippetContextItem = (
          snippet: SnippetSearchResult
        ): ContextV2.ContextItem | ContextV2.FileContextItem | undefined => {
          const { snippetId, directory, score, content } = snippet;

          const { type: snippetIdType, id: snippetIdValue } = snippetId;

          let location: string | undefined;
          if (snippetIdType === 'code-snippet') location = snippetIdValue;

          switch (snippetId.type) {
            case 'query':
            case 'route':
            case 'external-route':
              return {
                type: ContextV2.ContextItemType.DataRequest,
                content,
                directory,
                score,
              };
            case 'code-snippet':
              return {
                type: ContextV2.ContextItemType.CodeSnippet,
                content,
                directory,
                score,
                location,
              };
            default:
              warn(`[search-context] Unknown snippet type: ${snippetId.type}`);

            // TODO: Collect all matching events, then build a sequence diagram
            // case 'event':
            //   return await buildSequenceDiagram(snippet);
            // default:
            //   codeSnippets.push(snippet);
          }
        };

        const snippetSearchResults = snippetIndex.index.searchSnippets(
          this.vectorTerms.join(' OR '),
          maxSnippets
        );
        const context: ContextV2.ContextItem[] = [];
        for (const result of snippetSearchResults) {
          const contextItem = snippetContextItem(result);
          if (contextItem) context.push(contextItem);
        }

        // TODO: Build sequence diagrams

        contextCandidate = {
          // TODO: Fixme remove hard coded cast
          results: appmapSearchResponse.results as SearchRpc.SearchResult[],
          context,
          contextSize: snippetSearchResults.reduce((acc, result) => acc + result.content.length, 0),
        };

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
        maxSnippets = Math.ceil(maxSnippets * 1.5);
        log(`[search-context] Increasing max events per diagram to ${maxSnippets}.`);
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
