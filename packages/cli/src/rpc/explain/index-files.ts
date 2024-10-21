import sqlite3 from 'better-sqlite3';
import makeDebug from 'debug';

import {
  buildFileIndex,
  FileIndex,
  fileTokens,
  isBinaryFile,
  isDataFile,
  isLargeFile,
  listProjectFiles,
  readFileSafe,
} from '@appland/search';

const debug = makeDebug('appmap:rpc:explain:index-files');

const fileFilter = async (path: string) => {
  debug('Filtering: %s', path);
  if (isBinaryFile(path)) {
    debug('Skipping binary file: %s', path);
    return false;
  }

  const isData = isDataFile(path);
  if (isData && (await isLargeFile(path))) {
    debug('Skipping large data file: %s', path);
    return false;
  }

  return true;
};

export default async function indexFiles(
  db: sqlite3.Database,
  directories: string[]
): Promise<FileIndex> {
  const fileIndex = new FileIndex(db);

  await buildFileIndex(
    fileIndex,
    directories,
    listProjectFiles,
    fileFilter,
    readFileSafe,
    fileTokens
  );

  return fileIndex;
}
