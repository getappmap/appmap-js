import { dirname, join } from 'path';
import { Metadata } from '@appland/models';
import { readFile, rename, rm, stat, writeFile } from 'fs/promises';

import { exists, processNamedFiles, splitCamelized, verbose } from '../utils';
import { log } from 'console';
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

export type SearchResponse = {
  type: 'appmap';
  results: SearchResult[];
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

    const numResults = matches.length;
    if (verbose()) log(`[AppMapIndex] Got ${numResults} AppMap matches for search "${search}"`);

    if (options.maxResults && numResults > options.maxResults) {
      if (verbose()) log(`[FullText] Limiting to the top ${options.maxResults} matches`);
      matches = matches.slice(0, options.maxResults);
    }
    const searchResults = matches.map((match) => ({ appmap: match.ref, score: match.score }));
    return { type: 'appmap', results: searchResults, numResults };
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
