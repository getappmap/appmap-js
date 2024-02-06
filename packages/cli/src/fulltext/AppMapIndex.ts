import { dirname, join } from 'path';
import { Metadata } from '@appland/models';
import { readFile, rename, rm, stat, writeFile } from 'fs/promises';

import { exists, processNamedFiles, splitCamelized, verbose } from '../utils';
import { log, warn } from 'console';
import lunr from 'lunr';

type SerializedCodeObject = {
  name: string;
  type: string;
  labels: string[];
  children: SerializedCodeObject[];
  static?: boolean;
  sourceLocation?: string;
};

export type SearchOptions = {
  maxResults?: number;
};

export type SearchResult = {
  appmap: string;
  score: number;
};

export type SearchStats = {
  mean: number;
  median: number;
  stddev: number;
  max: number;
};

export type SearchResponse = {
  type: 'appmap';
  results: SearchResult[];
  stats: SearchStats;
  numResults: number;
};

async function buildDocument(metadataFile: string): Promise<any> {
  const metadata = JSON.parse(await readFile(metadataFile, 'utf-8')) as Metadata;
  const indexDir = dirname(metadataFile);
  const classMap = JSON.parse(
    await readFile(join(indexDir, 'classMap.json'), 'utf-8')
  ) as SerializedCodeObject[];
  const queries = new Array<string>();
  const codeObjects = new Array<string>();
  const routes = new Array<string>();
  const externalRoutes = new Array<string>();

  const collectFunction = (co: SerializedCodeObject) => {
    if (co.type === 'query') queries.push(co.name);
    else if (co.type === 'route') routes.push(co.name);
    else if (co.type === 'external-route') externalRoutes.push(co.name);
    else codeObjects.push(splitCamelized(co.name));

    co.children?.forEach((child) => {
      collectFunction(child);
    });
  };
  classMap.forEach((co) => collectFunction(co));

  const parameters = new Array<string>();
  if (await exists(join(indexDir, 'canonical.parameters.json'))) {
    const canonicalParameters = JSON.parse(
      await readFile(join(indexDir, 'canonical.parameters.json'), 'utf-8')
    ) as string[];
    canonicalParameters.forEach((cp) => {
      parameters.push(splitCamelized(cp));
    });
  }

  return {
    id: indexDir,
    name: metadata.name,
    source_location: metadata.source_location,
    code_objects: codeObjects.join(' '),
    queries: queries.join(' '),
    routes: routes.join(' '),
    external_routes: externalRoutes.join(' '),
    parameters: parameters,
  };
}

async function buildIndex(appmapDir: string): Promise<AppMapIndex> {
  const documents = new Array<any>();
  if (verbose()) log(`[AppMapIndex] Adding AppMaps to full-text index`);
  const startTime = Date.now();
  const appmaps = new Map<string, number>();

  await processNamedFiles(appmapDir, 'metadata.json', async (metadataFile: string) => {
    const appmapName = dirname(metadataFile);
    const appmapFileName = [appmapName, '.appmap.json'].join('');
    const stats = await stat(appmapFileName);
    appmaps.set(appmapName, stats.mtime.getTime());
    documents.push(await buildDocument(metadataFile));
  });

  const idx = lunr(function () {
    this.ref('id');
    this.field('name');
    this.field('source_location');
    this.field('code_objects');
    this.field('queries');
    this.field('routes');
    this.field('external_routes');
    this.field('parameters');

    this.tokenizer.separator = /[\s/-_:#.]+/;

    for (const doc of documents) this.add(doc);
  });

  const endTime = Date.now();
  if (verbose())
    log(
      `[AppMapIndex] Added ${documents.length} AppMaps to full-text index in ${
        endTime - startTime
      }ms`
    );
  return new AppMapIndex(appmapDir, appmaps, idx);
}

export default class AppMapIndex {
  constructor(
    public appmapDir: string,
    private appmaps: Map<string, number>,
    private idx: lunr.Index
  ) {}

  async search(search: string, options: SearchOptions = {}): Promise<SearchResponse> {
    let matches = this.idx.search(search);

    // Eliminate matches that don't exist on disk.
    // lunr doesn't have an API to remove a document from the index, so we have to do this manually.
    const appmapExists = new Map<string, boolean>();
    for (const match of matches) {
      const appmapFileName = [match.ref, '.appmap.json'].join('');
      const doesExist = await exists(appmapFileName);
      if (!doesExist) {
        if (verbose())
          warn(
            `[AppMapIndex] AppMap ${appmapFileName} does not exist, but we got it as a search match.`
          );
      }
      appmapExists.set(match.ref, doesExist);
    }
    matches = matches.filter((match) => appmapExists.get(match.ref));

    const numResults = matches.length;
    if (verbose()) log(`[AppMapIndex] Got ${numResults} AppMap matches for search "${search}"`);

    const maxScore = matches.reduce((acc, match) => Math.max(acc, match.score), 0);
    const medianScore = matches[Math.floor(numResults / 2)].score;
    const meanScore = matches.reduce((acc, match) => acc + match.score, 0) / numResults;
    const stddevScore = Math.sqrt(
      matches.reduce((acc, match) => acc + Math.pow(match.score, 2), 0) / numResults
    );

    if (verbose()) {
      log(`[AppMapIndex] Score stats:`);
      log(`  Max:    ${maxScore}`);
      log(`  Median: ${medianScore}`);
      log(`  Mean:   ${meanScore}`);
      log(`  StdDev: ${stddevScore}`);
      log(
        `Number which are least 1 stddev above the mean: ${
          matches.filter((match) => match.score > meanScore + stddevScore).length
        }`
      );
      log(
        `Number which are at least 2 stddev above the mean: ${
          matches.filter((match) => match.score > meanScore + 2 * stddevScore).length
        }`
      );
      log(
        `Number which are at least 3 stddev above the mean: ${
          matches.filter((match) => match.score > meanScore + 3 * stddevScore).length
        }`
      );
    }

    if (options.maxResults && numResults > options.maxResults) {
      if (verbose()) log(`[FullText] Limiting to the top ${options.maxResults} matches`);
      matches = matches.slice(0, options.maxResults);
    }
    const searchResults = matches.map((match) => ({ appmap: match.ref, score: match.score }));
    return {
      type: 'appmap',
      results: searchResults,
      stats: {
        mean: meanScore,
        median: medianScore,
        stddev: stddevScore,
        max: maxScore,
      },
      numResults,
    } as SearchResponse;
  }

  static async search(
    appmapDir: string,
    search: string,
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    const index = await buildIndex(appmapDir);
    return await index.search(search, options);
  }
}
