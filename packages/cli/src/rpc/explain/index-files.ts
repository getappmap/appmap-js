import sqlite3 from 'better-sqlite3';

import {
  buildFileIndex,
  FileIndex,
  fileTokens,
  listProjectFiles,
  readFileSafe,
} from '@appland/search';
import fileFilter from './fileFilter';

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
