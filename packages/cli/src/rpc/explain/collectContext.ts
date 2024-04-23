import { SearchRpc } from '@appland/rpc';
import { log } from 'console';
import { Token, stemmer } from 'lunr';
import { isAbsolute, join } from 'path';
import { ContextV2, applyContext } from '@appland/navie';

import AppMapIndex, { SearchResponse as AppMapSearchResponse } from '../../fulltext/AppMapIndex';
import FindEvents, {
  SearchResponse as EventSearchResponse,
  SearchResult as EventSearchResult,
} from '../../fulltext/FindEvents';
import { DEFAULT_MAX_DIAGRAMS, DEFAULT_MAX_FILES } from '../search/search';
import buildContext from './buildContext';
import { FileIndexMatch, buildFileIndex } from '../../fulltext/FileIndex';
import withIndex from '../../fulltext/withIndex';
import { Chunk, SourceIndexMatch, buildSourceIndex } from '../../fulltext/SourceIndex';
import { executeCommand } from '../../lib/executeCommand';
import { verbose } from '../../utils';
import { Git, GitState } from '../../telemetry';

export function textSearchResultToRpcSearchResult(
  eventResult: EventSearchResult
): SearchRpc.EventMatch {
  const result: SearchRpc.EventMatch = {
    fqid: eventResult.fqid,
    score: eventResult.score,
    eventIds: eventResult.eventIds,
  };
  if (eventResult.location) result.location = eventResult.location;
  if (eventResult.elapsed) result.elapsed = eventResult.elapsed;
  return result;
}

export class EventCollector {
  appmapIndexes = new Map<string, FindEvents>();

  constructor(private query: string, private appmapSearchResponse: AppMapSearchResponse) {}

  async collectEvents(maxEvents: number): Promise<{
    results: SearchRpc.SearchResult[];
    context: ContextV2.ContextResponse;
    contextSize: number;
  }> {
    const results = new Array<SearchRpc.SearchResult>();

    for (const result of this.appmapSearchResponse.results) {
      let { appmap } = result;
      if (!isAbsolute(appmap)) appmap = join(result.directory, appmap);

      const eventsSearchResponse = await this.findEvents(appmap, maxEvents);
      results.push({
        appmap: appmap,
        directory: result.directory,
        events: eventsSearchResponse.results.map(textSearchResultToRpcSearchResult),
        score: result.score,
      });
    }
    const context = await buildContext(results);

    const contextSize = context.reduce((acc, item) => acc + item.content.length, 0);

    return { results, context, contextSize };
  }

  async appmapIndex(appmap: string): Promise<FindEvents> {
    let index = this.appmapIndexes.get(appmap);
    if (!index) {
      index = new FindEvents(appmap);
      await index.initialize();
      this.appmapIndexes.set(appmap, index);
    }
    return index;
  }

  async findEvents(appmap: string, maxResults: number): Promise<EventSearchResponse> {
    if (appmap.endsWith('.appmap.json')) appmap = appmap.slice(0, -'.appmap.json'.length);

    const index = await this.appmapIndex(appmap);
    return index.search(this.query, { maxResults });
  }
}

const CHARS_PER_SNIPPET = 50;

export class SourceCollector {
  constructor(private keywords: string[], private fileSearchResponse: FileIndexMatch[]) {}

  async collectContext(directories: string[], charLimit: number): Promise<ContextV2.ContextItem[]> {
    const isntAllImports = (chunk: string) =>
      !chunk
        .split('\n')
        .every(
          (line) =>
            line.startsWith('import ') ||
            line.startsWith('from ') ||
            line.startsWith('require(') ||
            line.startsWith('const ') ||
            line.startsWith('let ') ||
            line.startsWith('var ')
        );

    const grepFiles = async (directory: string, keyword: string): Promise<string[]> => {
      // const grepCommand = `git grep -i -I -F -l ${keyword}`;
      const grepCommand = `git --no-pager grep -WiFn --no-color ${keyword}`;
      return (await executeCommand(grepCommand, verbose(), verbose(), verbose(), [0], directory))
        .split('--')
        .map((line) => line.trim())
        .filter(isntAllImports);
    };

    const files = [...this.fileSearchResponse];

    const matchToChunk = (directory: string, text: string): Chunk => {
      const lines = text.split('\n');
      const firstLine = lines[0];
      const lastLine = lines[lines.length - 1];

      // First line format: docs/blog/_posts/2021-06-30-flow-diagrams.md:21:matching text
      // Subsequent line format: docs/blog/_posts/2021-06-30-flow-diagrams.md-28-## Conclusion
      const [fileName, fromLine, line] = firstLine.split(':');
      const content = [line];
      let toLine = fromLine;
      for (const line of lines.slice(1, -1)) {
        const [lineNo, ...rest] = lastLine.slice(fileName.length).split('-');
        content.push(rest.join('-'));
        toLine = lineNo;
      }
      return {
        directory,
        fileName,
        from: parseInt(fromLine),
        to: parseInt(toLine),
        content: content.join('\n'),
      };
    };

    // TODO: Include results of `git status` in the search?
    const requiredKeywords = this.keywords.filter((keyword) => keyword.startsWith('+'));
    const chunks = new Array<Chunk>();
    if (requiredKeywords.length === 1) {
      for (const directory of directories) {
        if ((await Git.state(directory)) !== GitState.Ok) continue;

        const trimmedKeyword = requiredKeywords[0].slice(1);
        const stemmedKeyword = stemmer(new Token(trimmedKeyword, {})).toString();
        const keyword = trimmedKeyword.startsWith(stemmedKeyword) ? stemmedKeyword : trimmedKeyword;
        const rawChunks = await grepFiles(directory, keyword);
        log(
          `Matched ${rawChunks.length} files via git-grep in ${directory} using keyword ${keyword}.`
        );
        chunks.concat(...rawChunks.map((text) => matchToChunk(directory, text)));
      }
    }

    const sourceIndexDocuments = await withIndex(
      'source',
      (indexFileName: string) => buildSourceIndex(indexFileName, files, chunks),
      (index) => index.search(this.keywords, Math.round(charLimit / CHARS_PER_SNIPPET))
    );

    const buildLocation = (doc: SourceIndexMatch) => {
      const filePath = join(doc.directory, doc.fileName);
      return `${filePath}:${doc.from}-${doc.to}`;
    };

    return sourceIndexDocuments.map((doc: SourceIndexMatch) => ({
      type: ContextV2.ContextItemType.CodeSnippet,
      content: doc.content,
      location: buildLocation(doc),
    }));
  }
}

export class ContextCollector {
  public appmaps: string[] | undefined;

  query: string;

  constructor(
    private appmapDirectories: string[],
    private sourceDirectories: string[],
    private vectorTerms: string[],
    private charLimit: number
  ) {
    this.query = vectorTerms.join(' ');
  }

  async collectContext(): Promise<{
    searchResponse: SearchRpc.SearchResponse;
    context: ContextV2.ContextResponse;
  }> {
    const query = this.vectorTerms.join(' ');

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
      // Search across all AppMaps, creating a map from AppMap id to AppMapSearchResult
      const searchOptions = {
        maxResults: DEFAULT_MAX_DIAGRAMS,
      };
      appmapSearchResponse = await AppMapIndex.search(this.appmapDirectories, query, searchOptions);
    }

    const fileSearchResponse = await withIndex(
      'files',
      (indexFileName: string) => buildFileIndex(this.sourceDirectories, indexFileName),
      (index) => index.search(this.vectorTerms, DEFAULT_MAX_FILES)
    );

    const eventsCollector = new EventCollector(this.query, appmapSearchResponse);
    const sourceCollector = new SourceCollector(this.vectorTerms, fileSearchResponse);

    let contextCandidate: {
      results: SearchRpc.SearchResult[];
      context: ContextV2.ContextResponse;
      contextSize: number;
    };
    let charCount = 0;
    let maxEventsPerDiagram = 5;
    log(`Requested char limit: ${this.charLimit}`);
    for (;;) {
      log(`Collecting context with ${maxEventsPerDiagram} events per diagram.`);

      contextCandidate = await eventsCollector.collectEvents(maxEventsPerDiagram);

      const codeSnippetCount = contextCandidate.context.filter(
        (item) => item.type === ContextV2.ContextItemType.CodeSnippet
      ).length;
      let sourceContext: ContextV2.ContextResponse = [];
      if (codeSnippetCount === 0) {
        sourceContext = await sourceCollector.collectContext(
          this.sourceDirectories,
          this.charLimit
        );
      } else {
        sourceContext = await sourceCollector.collectContext(
          this.sourceDirectories,
          this.charLimit / 4
        );
      }
      contextCandidate.context.push(...sourceContext);

      const appliedContext = applyContext(contextCandidate.context, this.charLimit);
      const appliedContextSize = appliedContext.reduce((acc, item) => acc + item.content.length, 0);
      contextCandidate.context = appliedContext;
      contextCandidate.contextSize = appliedContextSize;
      log(`Collected an estimated ${appliedContextSize} characters.`);

      if (appliedContextSize === charCount || appliedContextSize > this.charLimit) {
        break;
      }
      charCount = appliedContextSize;
      maxEventsPerDiagram = Math.ceil(maxEventsPerDiagram * 1.5);
      log(`Increasing max events per diagram to ${maxEventsPerDiagram}.`);
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

export default async function collectContext(
  appmapDirectories: string[],
  sourceDirectories: string[],
  appmaps: string[] | undefined,
  vectorTerms: string[],
  charLimit: number
): Promise<{
  searchResponse: SearchRpc.SearchResponse;
  context: ContextV2.ContextResponse;
}> {
  const contextCollector = new ContextCollector(
    appmapDirectories,
    sourceDirectories,
    vectorTerms,
    charLimit
  );
  if (appmaps) contextCollector.appmaps = appmaps;
  return await contextCollector.collectContext();
}
