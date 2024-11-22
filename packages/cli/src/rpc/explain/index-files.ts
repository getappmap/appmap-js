import sqlite3 from 'better-sqlite3';
import makeDebug from 'debug';

import {
  buildFileIndex,
  FileIndex,
  fileTokens,
  listProjectFiles,
  readFileSafe,
} from '@appland/search';
import fileFilter from './fileFilter';

const debug = makeDebug('appmap:rpc:explain:index-files');

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
