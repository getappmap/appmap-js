import sqlite3 from 'better-sqlite3';
import { FileSearchResult, SessionId, SnippetIndex } from '@appland/search';

import buildIndexInTempDir, { CloseableIndex } from './build-index-in-temp-dir';
import { SearchResponse as AppMapSearchResponse } from './appmap-match';
import EventCollector from '../EventCollector';
import indexSnippets from '../index-snippets';
import { SearchRpc } from '@appland/rpc';
import { ContextV2 } from '@appland/navie';
import { SearchContextRequest } from '../collect-search-context';
import collectSnippets from '../collect-snippets';

export interface ProjectFileSnippetIndex {
  search(
    maxEventsPerDiagram: number,
    charLimit: number,
    request: SearchContextRequest
  ): Promise<{
    results: SearchRpc.SearchResult[];
    context: ContextV2.ContextResponse;
    contextSize: number;
  }>;

  close(): void;
}

class ProjectFileSnippetIndexImpl implements ProjectFileSnippetIndex {
  constructor(
    private vectorTerms: string[],
    private index: CloseableIndex<SnippetIndex>,
    private sessionId: SessionId,
    private eventsCollector: EventCollector
  ) {}

  async search(
    maxEventsPerDiagram: number,
    charLimit: number,
    request: SearchContextRequest
  ): Promise<{
    results: SearchRpc.SearchResult[];
    context: ContextV2.ContextResponse;
    contextSize: number;
  }> {
    const contextCandidate = await this.eventsCollector.collectEvents(
      maxEventsPerDiagram,
      request.excludePatterns,
      request.includePatterns,
      request.includeTypes
    );

    const codeSnippetCount = contextCandidate.context.filter(
      (item) => item.type === ContextV2.ContextItemType.CodeSnippet
    ).length;

    const codeSnippetCharLimit = codeSnippetCount === 0 ? charLimit : charLimit / 4;
    const sourceContext = collectSnippets(
      this.index.index,
      this.sessionId,
      this.vectorTerms.join(' OR '),
      codeSnippetCharLimit
    );
    contextCandidate.context = contextCandidate.context.concat(sourceContext);

    return contextCandidate;
  }

  close(): void {
    this.index.close();
  }
}

export async function buildProjectFileSnippetIndex(
  sessionId: SessionId,
  vectorTerms: string[],
  appmapSearchResponse: AppMapSearchResponse,
  fileSearchResults: FileSearchResult[]
): Promise<ProjectFileSnippetIndex> {
  const snippetIndex = await buildIndexInTempDir('snippets', async (indexFile) => {
    const db = new sqlite3(indexFile);
    return await indexSnippets(db, fileSearchResults);
  });

  const eventsCollector = new EventCollector(vectorTerms.join(' '), appmapSearchResponse);

  return new ProjectFileSnippetIndexImpl(vectorTerms, snippetIndex, sessionId, eventsCollector);
}
