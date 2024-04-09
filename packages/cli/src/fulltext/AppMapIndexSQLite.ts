import { dirname, join } from 'path';
import { Metadata } from '@appland/models';
import { mkdtemp, readFile, rm } from 'fs/promises';
import sqlite3 from 'better-sqlite3';
import { log, warn } from 'console';

import { decamelize, exists, processNamedFiles, verbose } from '../utils';
import UpToDate from '../lib/UpToDate';
import loadAppMapConfig from '../lib/loadAppMapConfig';
import { packRef, refToAppMapDir, unpackRef } from './ref';
import { existsSync } from 'fs';
import assert from 'assert';
import { tmpdir } from 'os';
import queryKeywords from './queryKeywords';

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
  directory: string;
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

type IndexDocument = {
  id: string;
  name: string;
  source_location?: string;
  code_objects: string;
  queries: string;
  routes: string;
  external_routes: string;
  parameters: string[];
};

async function buildDocument(directory: string, metadataFile: string): Promise<IndexDocument> {
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
    else codeObjects.push(decamelize(co.name, { separator: ' ' }));

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
      parameters.push(decamelize(cp, { separator: ' ' }));
    });
  }

  let appmapId = indexDir;
  if (appmapId.startsWith(directory)) appmapId = appmapId.substring(directory.length + 1);

  const id = packRef(directory, appmapId);
  return {
    id,
    name: metadata.name,
    source_location: metadata.source_location,
    code_objects: codeObjects.join(' '),
    queries: queries.join(' '),
    routes: routes.join(' '),
    external_routes: externalRoutes.join(' '),
    parameters: parameters,
  };
}

enum ScoreStats {
  StdDev = 'stddev',
  Mean = 'mean',
  Median = 'median',
  Max = 'max',
}

enum ScoreFactors {
  OutOfDateFactor = ScoreStats.StdDev,
  OutOfDateMultipler = 0.5,
}

export async function removeNonExistentMatches(matches: DbMatch[]): Promise<any[]> {
  const appmapExists = new Map<string, boolean>();
  for (const match of matches) {
    const appmapDir = refToAppMapDir(match.ref);
    const appmapFileName = [appmapDir, '.appmap.json'].join('');
    const doesExist = await exists(appmapFileName);
    if (!doesExist) {
      if (verbose())
        warn(
          `[AppMapIndex] AppMap ${appmapFileName} does not exist, but we got it as a search match.`
        );
    }
    appmapExists.set(match.ref, doesExist);
  }
  return matches.filter((match) => appmapExists.get(match.ref));
}

export function scoreMatches(matches: DbMatch[]): Map<ScoreStats, number> {
  const scoreStats = new Map<ScoreStats, number>();
  if (!matches.length) return scoreStats;

  const numResults = matches.length;
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

  scoreStats.set(ScoreStats.Max, maxScore);
  scoreStats.set(ScoreStats.Median, medianScore);
  scoreStats.set(ScoreStats.Mean, meanScore);
  scoreStats.set(ScoreStats.StdDev, stddevScore);

  return scoreStats;
}

type DbMatch = {
  ref: string;
  score: number;
};

async function downscoreOutOfDateMatches(
  scoreStats: Map<ScoreStats, number>,
  matches: DbMatch[],
  maxResults: number
): Promise<DbMatch[]> {
  const sortedMatches = new Array<DbMatch>();
  let i = 0;

  const finishedIterating = () => i >= matches.length;
  const matchBelowThreshold = () => {
    if (sortedMatches.length < maxResults) return false;

    const lastSortedMatch = sortedMatches[sortedMatches.length - 1];
    const match = matches[i];
    return match.score < lastSortedMatch.score;
  };
  const completed = () => finishedIterating() || matchBelowThreshold();

  while (!completed()) {
    const match = matches[i++];
    const downscore = scoreStats.get(ScoreStats.StdDev)! * ScoreFactors.OutOfDateMultipler;
    const { directory, appmapId } = unpackRef(match.ref);
    const upToDate = new UpToDate();
    upToDate.baseDir = directory;
    const outOfDateDependencies = await upToDate.isOutOfDate(appmapId);
    if (outOfDateDependencies) {
      if (verbose()) {
        log(
          `[AppMapIndex] AppMap ${refToAppMapDir(match.ref)} is out of date due to ${[
            ...outOfDateDependencies,
          ]}. Downscoring by ${downscore}.`
        );
      }
      match.score -= downscore;
    }

    sortedMatches.push(match);
    sortedMatches.sort((a, b) => b.score - a.score);
  }

  return sortedMatches;
}

export function reportMatches(
  matches: DbMatch[],
  scoreStats: Map<ScoreStats, number>,
  numResults: number
): SearchResponse {
  const searchResults = matches.map((match) => {
    const { directory, appmapId } = unpackRef(match.ref);
    return {
      appmap: appmapId,
      directory,
      score: match.score,
    };
  });
  return {
    type: 'appmap',
    results: searchResults,
    stats: [...scoreStats.keys()].reduce((acc, key) => {
      acc[key] = scoreStats.get(key as ScoreStats)!;
      return acc;
    }, {}) as SearchStats,
    numResults,
  };
}

export default class AppMapIndex {
  constructor(public directories: string[], private database: sqlite3.Database) {}

  async search(keywords: string[], options: SearchOptions = {}): Promise<SearchResponse> {
    const query = `SELECT ref, (rank * -1) score FROM appmaps WHERE appmaps MATCH ? ORDER BY bm25(appmaps, 1.0, 0.5)`;

    const searchExpr = queryKeywords(keywords).join(' OR ');
    const rows = this.database.prepare(query).all(searchExpr);
    const dbRefs = rows.map((row: any) => ({ ref: row.ref, score: row.score })) as DbMatch[];

    let refs = await removeNonExistentMatches(dbRefs);
    const numResults = refs.length;

    if (verbose())
      log(`[AppMapIndex] Got ${numResults} AppMap matches for search "${keywords.join(' ')}"`);

    const scoreStats = scoreMatches(refs);

    refs = await downscoreOutOfDateMatches(scoreStats, refs, options.maxResults || refs.length);

    if (options.maxResults && numResults > options.maxResults) {
      if (verbose()) log(`[FullText] Limiting to the top ${options.maxResults} matches`);
      refs = refs.slice(0, options.maxResults);
    }

    return reportMatches(refs, scoreStats, numResults);
  }
}

export function restoreAppMapIndex(indexFile: string, directories: string[]): AppMapIndex {
  assert(existsSync(indexFile), `Index file ${indexFile} does not exist`);
  const database = new sqlite3(indexFile);
  return new AppMapIndex(directories, database);
}

// This function is used for a "one-shot" search in which the index us built, used, and discarded.
// Replace this with a persistent index file that can be used across multiple searches, and is
// synced with the file system as needed.
export async function withAppMapIndex<T>(
  directories: string[],
  callback: (index: AppMapIndex) => T | Promise<T>
) {
  const tmpDir = await mkdtemp(join(tmpdir(), 'appmap-search-' + new Date().getTime()));
  const indexFile = join(tmpDir, 'appmap.index.sqlite');
  try {
    const index = await buildAppMapIndex(indexFile, directories);
    return await callback(index);
  } finally {
    await rm(tmpDir, { recursive: true });
  }
}

export async function buildAppMapIndex(
  indexFile: string,
  directories: string[]
): Promise<AppMapIndex> {
  assert(!existsSync(indexFile), `Index file ${indexFile} already exists`);
  const database = new sqlite3(indexFile);
  database.exec(
    `CREATE VIRTUAL TABLE appmaps USING fts5(ref UNINDEXED, text, tokenize = 'porter unicode61')`
  );

  if (verbose()) log(`[AppMapIndex] Adding AppMaps to full-text index`);
  const startTime = Date.now();
  let documentCount = 0;

  for (const directory of directories) {
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
      continue;
    }
    await processNamedFiles(
      join(directory, appmapDir),
      'metadata.json',
      async (metadataFile: string) => {
        const document = await buildDocument(directory, metadataFile);

        try {
          if (verbose()) console.log(`Indexing document ${document.id}`);
          const values = Object.values(document).filter(Boolean);
          values.splice(values.indexOf(document.id), 1);
          const keywords = queryKeywords(values.flat());
          database
            .prepare('INSERT INTO appmaps (ref, text) VALUES (?, ?)')
            .run(document.id, keywords.join(' '));
          documentCount += 1;
        } catch (error) {
          console.warn(`Error indexing document ${document.id}`);
          console.warn(error);
        }
      }
    );
  }

  const endTime = Date.now();
  if (verbose())
    log(
      `[AppMapIndex] Added ${documentCount} AppMaps to full-text index in ${endTime - startTime}ms`
    );
  return new AppMapIndex(directories, database);
}
