import yargs from 'yargs';
import sqlite3 from 'better-sqlite3';
import assert from 'assert';
import { readFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import { AppMap, AppMapFilter, buildAppMap, deserializeFilter } from '@appland/models';
import { FileIndex, generateSessionId } from '@appland/search';

import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { verbose } from '../../utils';
import searchSingleAppMap, { SearchOptions as SingleSearchOptions } from './searchSingleAppMap';
import { SearchResponse as DiagramsSearchResponse } from '../../rpc/explain/index/appmap-match';
import {
  SearchResult as EventSearchResult,
  SearchResponse as EventSearchResponse,
} from '../../fulltext/FindEvents';
import { openInBrowser } from '../open/openers';
import { buildAppMapIndex, search } from '../../rpc/explain/index/appmap-index';
import buildIndexInTempDir from '../../rpc/explain/index/build-index-in-temp-dir';

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

type ArgumentTypes = {
  directory: string;
  query: string;
  appmap: string;
  contextDepth: number;
  maxSize: string;
  filter: string;
  show: boolean;
  maxResults: number;
  findEvents: boolean;
  format: 'json' | 'appmap';
  verbose: boolean;
};

export const handler = async (argv: ArgumentTypes) => {
  verbose(argv.verbose);

  const { directory, query, appmap, contextDepth, show, maxResults, findEvents, format } = argv;

  handleWorkingDirectory(directory);

  const sessionId = generateSessionId();

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
    const options: SingleSearchOptions = {
      maxResults,
    };
    const { maxSize, filter: filterStr } = argv;
    if (maxSize) options.maxSize = parseInt(maxSize);
    if (filterStr) options.filter = deserializeFilter(filterStr);
    const response = await searchSingleAppMap(appmap, query, options);
    await presentResults(response);
  } else {
    const options = {
      maxResults,
    };

    const index = await buildIndexInTempDir('appmaps', async (indexFile) => {
      const db = new sqlite3(indexFile);
      const fileIndex = new FileIndex(db);
      await buildAppMapIndex(fileIndex, [process.cwd()]);
      return fileIndex;
    });

    const response = await search(
      index.index,
      sessionId,
      query.split(/\s+/).join(' OR '),
      maxResults
    );
    index.close();

    if (findEvents) {
      const eventOptions: SingleSearchOptions = { maxResults };
      const { maxSize, filter: filterStr } = argv;
      if (maxSize) eventOptions.maxSize = parseInt(maxSize, 10);
      if (filterStr) eventOptions.filter = deserializeFilter(filterStr);

      const { results } = response;
      let eventResults = new Array<EventSearchResult>();
      for (const result of results) {
        const response = await searchSingleAppMap(result.appmap, query, options);
        eventResults.push(...response.results);
      }
      const numResults = eventResults.length;
      eventResults.sort((a, b) => b.score - a.score);
      if (eventResults.length > maxResults) eventResults = eventResults.slice(0, maxResults);
      await presentResults({ type: 'event', numResults: numResults, results: eventResults });
    } else {
      await presentResults(response);
    }
  }
};
