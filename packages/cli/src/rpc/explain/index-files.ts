import sqlite3 from 'better-sqlite3';
import makeDebug from 'debug';

import {
  buildFileIndex,
  FileIndex,
  fileTokens,
  FilterFn,
  isBinaryFile,
  isDataFile,
  isLargeFile,
  listProjectFiles,
  readFileSafe,
} from '@appland/search';
import { fileNameMatchesFilterPatterns } from '../../fulltext/fileNameMatchesFilterPatterns';

const debug = makeDebug('appmap:rpc:explain:index-files');

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

export default async function indexFiles(
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
