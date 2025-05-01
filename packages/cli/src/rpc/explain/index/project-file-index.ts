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

import ContentRestrictions from '../ContentRestrictions';

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

    if (ContentRestrictions.instance.safeRestricted(path)) {
      debug('Skipping restricted file: %s', path);
      return false;
    }

    const isData = isDataFile(path);
    if (isData && (await isLargeFile(path))) {
      debug('Skipping large data file: %s', path);
      return false;
    }

    return true;
  };
}

async function indexFiles(
  fileIndex: FileIndex,
  directories: string[],
  includePatterns: RegExp[] | undefined,
  excludePatterns: RegExp[] | undefined
): Promise<FileIndex> {
  const filter = fileFilter(includePatterns, excludePatterns);
  await buildFileIndex(fileIndex, directories, listProjectFiles, filter, readFileSafe, fileTokens);

  return fileIndex;
}

export async function buildProjectFileIndex(
  sourceDirectories: string[],
  includePatterns: RegExp[] | undefined,
  excludePatterns: RegExp[] | undefined
): Promise<FileIndex> {
  const index = await FileIndex.cached('files', ...sourceDirectories);
  return await indexFiles(index, sourceDirectories, includePatterns, excludePatterns);
}

export async function searchProjectFiles(
  sessionId: SessionId,
  sourceDirectories: string[],
  includePatterns: RegExp[] | undefined,
  excludePatterns: RegExp[] | undefined,
  vectorTerms: string[]
): Promise<FileSearchResult[]> {
  performance.mark('start building file index');
  const index = await buildProjectFileIndex(sourceDirectories, includePatterns, excludePatterns);
  performance.measure('build file index', 'start building file index');
  performance.mark('start search project files');
  try {
    return index.search(vectorTerms.join(' OR '));
  } finally {
    index.close();
    performance.measure('search project files', 'start search project files');
  }
}
