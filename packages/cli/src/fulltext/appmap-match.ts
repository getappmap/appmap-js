import UpToDate from '../lib/UpToDate';
import { exists } from '../utils';

import makeDebug from 'debug';

const debug = makeDebug('appmap:fulltext:appmap-match');

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

export type Match = {
  appmapId: string;
  directory: string;
  score: number;
};

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

export async function removeNonExistentMatches(matches: Match[]): Promise<Match[]> {
  const result = new Array<Match>();
  for (const match of matches) {
    const { appmapId } = match;
    const appmapFileName = [appmapId, '.appmap.json'].join('');
    const doesExist = await exists(appmapFileName);
    if (doesExist) {
      result.push(match);
    } else {
      debug(`AppMap ${appmapFileName} does not exist, but we got it as a search match.`);
    }
  }
  return result;
}

export function scoreMatches(matches: Match[]): Map<ScoreStats, number> {
  const scoreStats = new Map<ScoreStats, number>();
  if (!matches.length) return scoreStats;

  const numResults = matches.length;
  const maxScore = matches.reduce((acc, match) => Math.max(acc, match.score), 0);
  const medianScore = matches[Math.floor(numResults / 2)].score;
  const meanScore = matches.reduce((acc, match) => acc + match.score, 0) / numResults;
  const stddevScore = Math.sqrt(
    matches.reduce((acc, match) => acc + Math.pow(match.score, 2), 0) / numResults
  );

  debug(`Score stats:`);
  debug(`  Max:    ${maxScore}`);
  debug(`  Median: ${medianScore}`);
  debug(`  Mean:   ${meanScore}`);
  debug(`  StdDev: ${stddevScore}`);
  debug(
    `Number which are least 1 stddev above the mean: ${
      matches.filter((match) => match.score > meanScore + stddevScore).length
    }`
  );
  debug(
    `Number which are at least 2 stddev above the mean: ${
      matches.filter((match) => match.score > meanScore + 2 * stddevScore).length
    }`
  );
  debug(
    `Number which are at least 3 stddev above the mean: ${
      matches.filter((match) => match.score > meanScore + 3 * stddevScore).length
    }`
  );

  scoreStats.set(ScoreStats.Max, maxScore);
  scoreStats.set(ScoreStats.Median, medianScore);
  scoreStats.set(ScoreStats.Mean, meanScore);
  scoreStats.set(ScoreStats.StdDev, stddevScore);

  return scoreStats;
}

/**
 * Adjusts the scores of AppMap search matches based on their out-of-dateness.
 *
 * This function iterates over a list of search match results, determining if the matched
 * AppMaps are out-of-date. If so, it reduces their score by a calculated "downscore"
 * value based on the standard deviation of scores. It only processes until the specified
 * maximum number of results is determined.
 *
 * @param scoreStats - A map containing score statistics (e.g., standard deviation).
 * @param matches - An array of search match objects containing details about AppMaps.
 * @param maxResults - The maximum number of results that should be considered.
 * @returns A promise that resolves to a sorted array of matches with adjusted scores.
 */
export async function downscoreOutOfDateMatches(
  scoreStats: Map<ScoreStats, number>,
  matches: Match[],
  maxResults: number
): Promise<Match[]> {
  const sortedMatches = new Array<Match>();
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
    const { directory, appmapId } = match;
    const upToDate = new UpToDate();
    upToDate.baseDir = directory;
    const outOfDateDependencies = await upToDate.isOutOfDate(appmapId);
    if (outOfDateDependencies) {
      debug(
        `AppMap ${appmapId} is out of date due to ${[...outOfDateDependencies].join(
          ', '
        )}. Downscoring by ${downscore}.`
      );
      match.score -= downscore;
    }

    sortedMatches.push(match);
    sortedMatches.sort((a, b) => b.score - a.score);
  }

  return sortedMatches;
}

export function reportMatches(
  matches: Match[],
  scoreStats: Map<ScoreStats, number>,
  numResults: number
): SearchResponse {
  const searchResults = matches.map((match) => {
    const { directory, appmapId } = match;
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
      acc[key] = scoreStats.get(key)!;
      return acc;
    }, {}) as SearchStats,
    numResults,
  };
}
