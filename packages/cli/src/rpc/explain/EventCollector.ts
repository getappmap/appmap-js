import { isAbsolute, join } from 'path';
import { ContextV2 } from '@appland/navie';
import { SearchRpc } from '@appland/rpc';
import { SearchResponse as AppMapSearchResponse } from '../../fulltext/appmap-match';
import FindEvents, {
  SearchResponse as EventSearchResponse,
  SearchOptions as EventsSearchOptions,
  SearchOptions,
} from '../../fulltext/FindEvents';
import buildContext from './buildContext';
import { textSearchResultToRpcSearchResult } from './collectContext';

export default class EventCollector {
  appmapIndexes = new Map<string, FindEvents>();

  constructor(private query: string, private appmapSearchResponse: AppMapSearchResponse) {}

  async collectEvents(
    maxEvents: number,
    excludePatterns?: RegExp[],
    includePatterns?: RegExp[],
    includeTypes?: ContextV2.ContextItemType[]
  ): Promise<{
    results: SearchRpc.SearchResult[];
    context: ContextV2.ContextResponse;
    contextSize: number;
  }> {
    const results = new Array<SearchRpc.SearchResult>();

    for (const result of this.appmapSearchResponse.results) {
      let { appmap } = result;
      if (!isAbsolute(appmap)) appmap = join(result.directory, appmap);

      const options: EventsSearchOptions = {
        maxResults: maxEvents,
      };
      if (includePatterns) options.includePatterns = includePatterns;
      if (excludePatterns) options.excludePatterns = excludePatterns;

      const eventsSearchResponse = await this.findEvents(appmap, options);
      results.push({
        appmap: appmap,
        directory: result.directory,
        events: eventsSearchResponse.results.map(textSearchResultToRpcSearchResult),
        score: result.score,
      });
    }

    const isIncludedType = (item: ContextV2.ContextItem) => {
      if (includeTypes && !includeTypes.some((type) => type === item.type)) return false;

      return true;
    };

    const context = (await buildContext(results)).filter(isIncludedType);

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

  async findEvents(appmap: string, options: SearchOptions): Promise<EventSearchResponse> {
    if (appmap.endsWith('.appmap.json')) appmap = appmap.slice(0, -'.appmap.json'.length);

    const index = await this.appmapIndex(appmap);
    return index.search(this.query, options);
  }
}
