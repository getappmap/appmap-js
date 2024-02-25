import yargs from 'yargs';

import assert from 'assert';
import { readFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import { AppMap, AppMapFilter, buildAppMap, deserializeFilter } from '@appland/models';

import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { verbose } from '../../utils';
import { locateAppMapDir } from '../../lib/locateAppMapDir';
import searchSingleAppMap, {
  SearchSingleMapOptions,
  SearchSingleMapOptions as SingleSearchOptions,
} from './searchSingleAppMap';
import AppMapIndex, {
  SearchResponse as DiagramsSearchResponse,
  SearchOptions,
} from '../../fulltext/AppMapIndex';
import {
  SearchResult as EventSearchResult,
  SearchResponse as EventSearchResponse,
} from '../../fulltext/FindEvents';
import { openInBrowser } from '../open/openers';

export const command = 'search <query>';
export const describe =
  'Search AppMaps, or a single AppMap, for search matches to a full-text query.';

export const builder = (args: yargs.Argv) => {
  args.positional('query', {
    describe: 'full-text query',
    type: 'string',
    demandOption: true,
  });

  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });

  args.option('find-events', {
    describe: 'find events within AppMap search results',
    type: 'boolean',
  });

  args.option('context-depth', {
    describe: 'depth of call stack context to include around search matches',
    type: 'number',
    default: 2,
  });

  args.option('appmap', {
    describe: 'AppMap to search',
    type: 'string',
    alias: 'a',
  });

  args.option('max-results', {
    describe: 'maximum number of search results to return',
    type: 'number',
  });

  args.option('max-size', {
    describe: 'prune AppMap to a maximum size before searching (used only with --appmap option)',
    type: 'string',
  });

  args.option('filter', {
    describe: 'serialized AppMap filter to apply to the AppMap (used only with --appmap option)',
    type: 'string',
  });

  args.option('show', {
    describe: 'open AppMaps in a visual tool such as VSCode or the browser',
    boolean: false,
  });

  args.option('format', {
    describe:
      'output format to use for printing the output. json: JSON serialization of the search results. appmap: AppMap data focused on the search results (only available with --appmap or --find-events options)',
    choices: ['json', 'appmap'],
    default: 'json',
    alias: 'f',
  });

  return args.strict();
};

export const handler = async (argv: any) => {
  verbose(argv.verbose);

  const { directory, query, appmap, contextDepth, show, maxResults, findEvents, format } = argv;

  handleWorkingDirectory(directory);

  function printResultsJSON(response: EventSearchResponse | DiagramsSearchResponse) {
    console.log(JSON.stringify(response, null, 2));
  }

  async function printResultsAppMap(
    response: EventSearchResponse | DiagramsSearchResponse
  ): Promise<void> {
    if (response.type === 'appmap')
      throw new Error(`Cannot output appmap format for appmap search results`);

    const { results } = response;
    const fqidsByAppMap = new Map<string, string[]>();
    for (const result of results) {
      const fqids = fqidsByAppMap.get(result.appmap) || [];
      fqids.push(result.fqid);
      fqidsByAppMap.set(result.appmap, fqids);
    }

    const filterAppMap = (appmapId: string): AppMap => {
      const fqids = fqidsByAppMap.get(appmapId);
      assert(fqids);

      const appmap = buildAppMap()
        .source(readFileSync(appmapId + '.appmap.json', 'utf-8'))
        .build();

      const filter = new AppMapFilter();
      filter.declutter.context.on = true;
      filter.declutter.context.names = fqids;
      filter.declutter.context.depth = contextDepth;

      return filter.filter(appmap, []);
    };

    const appmaps = new Array<AppMap>();
    let count = 0;
    const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 100);
    // const outputDir = `.appmap/search-results/${sanitize(query)}`;
    for (const appmapId of fqidsByAppMap.keys()) {
      const filteredAppMap = filterAppMap(appmapId);
      if (show) {
        const appmapFile = `${sanitize(query)}_${count}.appmap.json`;
        await writeFile(appmapFile, JSON.stringify(filteredAppMap, null, 2));
        await openInBrowser(appmapFile, false);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        appmaps.push(filteredAppMap);
      }
      count += 1;
    }
    if (appmaps.length > 0) console.log(JSON.stringify(appmaps));
  }

  async function presentResults(
    response: EventSearchResponse | DiagramsSearchResponse
  ): Promise<void> {
    if (format === 'json') {
      printResultsJSON(response);
    } else if (format === 'appmap') {
      await printResultsAppMap(response);
    } else {
      throw new Error(`Unknown format: ${format}`);
    }
  }

  if (appmap) {
    const options: SearchSingleMapOptions = {
      maxResults,
    };
    const { maxSize, filter: filterStr } = argv;
    if (maxSize) options.maxSize = maxSize;
    if (filterStr) options.filter = deserializeFilter(filterStr);
    const response = await searchSingleAppMap(appmap, query, options);
    await presentResults(response);
  } else {
    const options: SearchOptions = {
      maxResults,
    };
    const appmapDir = await locateAppMapDir();
    const response = await AppMapIndex.search(appmapDir, query, options);
    if (findEvents) {
      const eventOptions: SingleSearchOptions = { maxResults };
      const { maxSize, filter: filterStr } = argv;
      if (maxSize) eventOptions.maxSize = maxSize;
      if (filterStr) eventOptions.filter = deserializeFilter(filterStr);

      const { results } = response;
      let eventResults = new Array<EventSearchResult>();
      for (const result of results) {
        const response = await searchSingleAppMap(result.appmap, query, options);
        eventResults.push(...response.results);
      }
      const numResults = eventResults.length;
      // TODO: Comparing scores across matches from different AppMaps is not a good idea.
      // The scores are only directly comparable within the context of a single AppMap.
      eventResults.sort((a, b) => b.score - a.score);
      if (eventResults.length > maxResults) eventResults = eventResults.slice(0, maxResults);
      await presentResults({
        type: 'event',
        stats: response.stats,
        numResults: numResults,
        results: eventResults,
      });
    } else {
      await presentResults(response);
    }
  }
};
