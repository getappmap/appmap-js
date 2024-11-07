import { isAbsolute, join, relative } from 'path';
import { isNativeError } from 'util/types';
import { log, warn } from 'console';
import { readFile } from 'fs/promises';
import { Metadata } from '@appland/models';
import { buildFileIndex, FileIndex, fileTokens } from '@appland/search';

import { findFiles, isNodeError, verbose } from '../utils';
import {
  downscoreOutOfDateMatches,
  Match,
  removeNonExistentMatches,
  reportMatches,
  scoreMatches,
  SearchResponse,
} from './appmap-match';
import loadAppMapConfig from '../lib/loadAppMapConfig';

type ClassMapEntry = {
  name: string;
  type: string;
  labels: string[];
  children: ClassMapEntry[];
  static?: boolean;
  sourceLocation?: string;
};

/**
 * List all appmap.json files in a directory.
 */
export async function listAppMaps(directory: string): Promise<string[]> {
  const appmapConfig = await loadAppMapConfig(join(directory, 'appmap.yml'));
  let appmapDir: string | undefined;
  if (appmapConfig) {
    appmapDir = appmapConfig.appmap_dir ?? 'tmp/appmap';
  }
  if (!appmapDir) {
    if (verbose())
      log(
        `[AppMapIndex] Skipping directory ${directory} because it does not contain an AppMap configuration`
      );
    return [];
  }

  const appmapFiles = await findFiles(join(directory, appmapDir), '.appmap.json');
  if (verbose()) log(`[appmap-index] Found ${appmapFiles.length} AppMap files in ${directory}`);
  const relativeToPath = (file: string) => (isAbsolute(file) ? relative(directory, file) : file);
  return appmapFiles.map(relativeToPath);
}

/**
 * Read all content for an AppMap. For efficiency, utilizes the AppMap index files, rather
 * than reading the entire AppMap file directly.
 */
export async function readAppMapContent(appmapFile: string): Promise<string> {
  const appmapName = appmapFile.replace(/\.appmap\.json$/, '');

  async function readIndexFile<T>(name: string): Promise<T | undefined> {
    const indexFile = join(appmapName, [name, '.json'].join(''));
    let indexStr: string;
    try {
      indexStr = await readFile(indexFile, 'utf-8');
    } catch (e) {
      if (isNativeError(e) && !isNodeError(e, 'ENOENT')) {
        warn(`Error reading metadata file ${indexFile}: ${e.message}`);
      }
      return undefined;
    }

    try {
      return JSON.parse(indexStr) as T;
    } catch (e) {
      const errorMessage = isNativeError(e) ? e.message : String(e);
      warn(`Error parsing metadata file ${indexFile}: ${errorMessage}`);
    }
  }

  const appmapWords = new Array<string>();

  const metadata = await readIndexFile<Metadata>('metadata');
  if (metadata) {
    appmapWords.push(metadata.name);
    if (metadata.labels) appmapWords.push(...metadata.labels);
    if (metadata.exception) appmapWords.push(metadata.exception.message);
  }

  const classMap = (await readIndexFile<ClassMapEntry[]>('classMap')) ?? [];

  const queries = new Array<string>();
  const codeObjects = new Array<string>();
  const routes = new Array<string>();
  const externalRoutes = new Array<string>();
  const types = new Set<string>();

  const collectClassMapEntry = (cme: ClassMapEntry) => {
    if (cme.type === 'query') {
      queries.push(cme.name);
      types.add('sql');
      types.add('query');
      types.add('database');
    } else if (cme.type === 'route') {
      routes.push(cme.name);
      types.add('route');
      types.add('request');
      types.add('server');
      types.add('http');
    } else if (cme.type === 'external-route') {
      externalRoutes.push(cme.name);
      types.add('route');
      types.add('request');
      types.add('client');
      types.add('http');
    } else codeObjects.push(cme.name);

    cme.children?.forEach((child) => {
      collectClassMapEntry(child);
    });
  };
  classMap.forEach((co) => collectClassMapEntry(co));
  appmapWords.push(...queries, ...codeObjects, ...routes, ...externalRoutes);

  const parameters = (await readIndexFile<string[]>('canonical.parameters')) ?? [];
  appmapWords.push(...parameters);
  appmapWords.push(...types);

  return appmapWords.join(' ');
}

export function trueFilter(): Promise<boolean> {
  return Promise.resolve(true);
}

/**
 * Build an index of all AppMaps in the specified directories.
 */
export async function buildAppMapIndex(fileIndex: FileIndex, directories: string[]): Promise<void> {
  return buildFileIndex(
    fileIndex,
    directories,
    listAppMaps,
    trueFilter,
    readAppMapContent,
    fileTokens
  );
}

export async function search(
  index: FileIndex,
  search: string,
  maxResults: number
): Promise<SearchResponse> {
  const searchMatches = index.search(search, maxResults);
  let matches: Match[] = searchMatches.map((match) => {
    let appmapId = match.filePath;
    if (appmapId.endsWith('.appmap.json'))
      appmapId = match.filePath.slice(0, -'.appmap.json'.length);
    return {
      appmapId,
      directory: match.directory,
      score: match.score,
    };
  });

  matches = await removeNonExistentMatches(matches);
  const numResults = matches.length;

  if (verbose()) log(`[appmap-index] Got ${numResults} AppMap matches for search "${search}"`);

  const scoreStats = scoreMatches(matches);

  matches = await downscoreOutOfDateMatches(scoreStats, matches, maxResults || matches.length);

  if (maxResults && numResults > maxResults) {
    if (verbose()) log(`[appmap-index] Limiting to the top ${maxResults} matches`);
    matches = matches.slice(0, maxResults);
  }

  return reportMatches(matches, scoreStats, numResults);
}
