import { dirname, join } from 'path';
import { Metadata } from '@appland/models';
import { readFile, rename, rm, stat, writeFile } from 'fs/promises';

import { exists, processNamedFiles, splitCamelized, verbose } from '../utils';
import { log, warn } from 'console';
import lunr from 'lunr';
import UpToDate from '../lib/UpToDate';
import loadAppMapConfig from '../lib/loadAppMapConfig';

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

async function buildIndex(directories: string[]): Promise<AppMapIndex> {
  const documents = new Array<any>();
  if (verbose()) log(`[AppMapIndex] Adding AppMaps to full-text index`);
  const startTime = Date.now();

  for (const directory of directories) {
    const appmapDir = (await loadAppMapConfig(join(directory, 'appmap.yml')))?.appmap_dir;
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
        documents.push(await buildDocument(metadataFile));
      }
    );
  }

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
  return new AppMapIndex(directories, idx);
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

export async function removeNonExistentMatches(matches: lunr.Index.Result[]) {
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
  return matches.filter((match) => appmapExists.get(match.ref));
}

export function scoreMatches(matches: lunr.Index.Result[]): Map<ScoreStats, number> {
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

async function downscoreOutOfDateMatches(
  scoreStats: Map<ScoreStats, number>,
  matches: lunr.Index.Result[],
  maxResults: number
): Promise<lunr.Index.Result[]> {
  const upToDate = new UpToDate();
  const sortedMatches = new Array<lunr.Index.Result>();
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
    const outOfDateDependencies = await upToDate.isOutOfDate(match.ref);
    if (outOfDateDependencies) {
      if (verbose()) {
        log(
          `[AppMapIndex] AppMap ${match.ref} is out of date due to ${[
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
  matches: lunr.Index.Result[],
  scoreStats: Map<ScoreStats, number>,
  numResults: number
): SearchResponse {
  const searchResults = matches.map((match) => ({ appmap: match.ref, score: match.score }));
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
  constructor(public directories: string[], private idx: lunr.Index) {}

  async search(search: string, options: SearchOptions = {}): Promise<SearchResponse> {
    let matches = this.idx.search(search);
    matches = await removeNonExistentMatches(matches);
    const numResults = matches.length;

    if (verbose()) log(`[AppMapIndex] Got ${numResults} AppMap matches for search "${search}"`);

    const scoreStats = scoreMatches(matches);

    matches = await downscoreOutOfDateMatches(
      scoreStats,
      matches,
      options.maxResults || matches.length
    );

    if (options.maxResults && numResults > options.maxResults) {
      if (verbose()) log(`[FullText] Limiting to the top ${options.maxResults} matches`);
      matches = matches.slice(0, options.maxResults);
    }

    return reportMatches(matches, scoreStats, numResults);
  }

  static async search(
    directories: string[],
    search: string,
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    const index = await buildIndex(directories);
    return await index.search(search, options);
  }
}
