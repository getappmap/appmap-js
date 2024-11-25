import sqlite3 from 'better-sqlite3';
import makeDebug from 'debug';

import {
  buildFileIndex,
  FileIndex,
  FileSearchResult,
  fileTokens,
  FilterFn,
  isBinaryFile,
  isDataFile,
  isLargeFile,
  listProjectFiles,
  readFileSafe,
  SessionId,
} from '@appland/search';
import { fileNameMatchesFilterPatterns } from './filter-patterns';

import buildIndexInTempDir, { CloseableIndex } from './build-index-in-temp-dir';

const debug = makeDebug('appmap:index:project-files');

function fileFilter(
  includePatterns: RegExp[] | undefined,
  excludePatterns: RegExp[] | undefined
): FilterFn {
  return async (path: string) => {
    debug('Filtering: %s', path);
    if (isBinaryFile(path)) {
      debug('Skipping binary file: %s', path);
      return false;
    }

    const includeFile = fileNameMatchesFilterPatterns(path, includePatterns, excludePatterns);
    if (!includeFile) return false;

    const isData = isDataFile(path);
    if (isData && (await isLargeFile(path))) {
      debug('Skipping large data file: %s', path);
      return false;
    }

    return true;
  };
}

async function indexFiles(
  db: sqlite3.Database,
  directories: string[],
  includePatterns: RegExp[] | undefined,
  excludePatterns: RegExp[] | undefined
): Promise<FileIndex> {
  const fileIndex = new FileIndex(db);

  const filter = fileFilter(includePatterns, excludePatterns);
  await buildFileIndex(fileIndex, directories, listProjectFiles, filter, readFileSafe, fileTokens);

  return fileIndex;
}

export async function buildProjectFileIndex(
  sourceDirectories: string[],
  includePatterns: RegExp[] | undefined,
  excludePatterns: RegExp[] | undefined
): Promise<CloseableIndex<FileIndex>> {
  return await buildIndexInTempDir('files', async (indexFile) => {
    const db = new sqlite3(indexFile);
    return await indexFiles(db, sourceDirectories, includePatterns, excludePatterns);
  });
}

export async function searchProjectFiles(
  sessionId: SessionId,
  sourceDirectories: string[],
  includePatterns: RegExp[] | undefined,
  excludePatterns: RegExp[] | undefined,
  vectorTerms: string[]
): Promise<FileSearchResult[]> {
  const index = await buildProjectFileIndex(sourceDirectories, includePatterns, excludePatterns);
  try {
    return index.index.search(sessionId, vectorTerms.join(' OR '));
  } finally {
    index.close();
  }
}
