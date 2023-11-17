import { readFile } from 'fs/promises';
import { exists, processNamedFiles, verbose } from '../utils';
import { Metadata } from '@appland/models';
import { dirname, join } from 'path';
import { warn } from 'console';
import lunr from 'lunr';
import assert from 'assert';

const isCamelized = (str: string): boolean => {
  if (str.length < 3) return false;

  const testStr = str.slice(1);
  return /[a-z][A-Z]/.test(testStr);
};

export const splitCamelized = (str: string): string => {
  if (!isCamelized(str)) return str;

  const result = new Array<string>();
  let last = 0;
  for (let i = 1; i < str.length; i++) {
    const pc = str[i - 1];
    const c = str[i];
    const isUpper = c >= 'A' && c <= 'Z';
    if (isUpper) {
      result.push(str.slice(last, i));
      last = i;
    }
  }
  result.push(str.slice(last));
  return result.join(' ');
};

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

export default class FindAppMaps {
  idx: lunr.Index | undefined;

  constructor(public appmapDir: string) {}

  async initialize() {
    const { appmapDir } = this;

    const documents = new Array<any>();
    await processNamedFiles(appmapDir, 'metadata.json', async (metadataFile) => {
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

      documents.push({
        id: indexDir,
        name: metadata.name,
        source_location: metadata.source_location,
        code_objects: codeObjects.join(' '),
        queries: queries.join(' '),
        routes: routes.join(' '),
        external_routes: externalRoutes.join(' '),
        parameters: parameters,
      });
    });

    if (verbose()) warn(`Indexing ${documents.length} diagrams`);

    this.idx = lunr(function () {
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
  }

  search(search: string, options: SearchOptions = {}): SearchResult[] {
    assert(this.idx);
    let matches = this.idx.search(search);
    if (verbose()) warn(`Got ${matches.length} matches for search ${search}`);
    if (options.maxResults && matches.length > options.maxResults) {
      if (verbose()) warn(`Limiting to the top ${options.maxResults} matches`);
      matches = matches.slice(0, options.maxResults);
    }
    return matches.map((match) => ({ appmap: match.ref, score: match.score }));
  }
}
