import { log } from 'console';
import sqlite3 from 'better-sqlite3';
import assert from 'assert';
import { existsSync } from 'fs';

import { verbose } from '../utils';
import queryKeywords from './queryKeywords';
import path from 'path';
import { Git, GitState } from '../telemetry';
import listProjectFiles, { COMMON_REPO_BINARY_FILE_EXTENSIONS } from './listProjectFiles';
import listGitProjectFiles from './listGitProjectFIles';

export type FileIndexMatch = {
  directory: string;
  fileName: string;
  score: number;
};

export class FileIndex {
  constructor(public database: sqlite3.Database) {}

  close() {
    this.database.close();
  }

  search(keywords: string[], limit = 10): FileIndexMatch[] {
    const query = `SELECT directory, file_name, (rank * -1) score FROM files WHERE files MATCH ? ORDER BY rank LIMIT ?`;

    const searchExpr = queryKeywords(keywords).join(' OR ');
    const rows = this.database.prepare(query).all(searchExpr, limit);
    rows.forEach((row: any) => {
      if (verbose()) console.log(`Found row ${row.file_name}`);
    });
    return rows.map((row: any) => ({
      directory: row.directory,
      fileName: row.file_name,
      score: row.score,
    }));
  }

  initializeIndex() {
    this.database.exec(
      `CREATE VIRTUAL TABLE files USING fts5(directory UNINDEXED, file_name UNINDEXED, terms, tokenize = 'porter unicode61')`
    );
  }

  async indexDirectories(directories: string[]) {
    for (const directory of directories) {
      const gitState = await Git.state(directory);

      let fileNames: string[];
      if (gitState === GitState.Ok) {
        fileNames = await listGitProjectFiles(directory);
      } else {
        fileNames = await listProjectFiles(directory);
      }
      for (const fileName of fileNames) {
        this.indexFile(directory, fileName);
      }
    }
  }

  indexFile(directory: string, filePath: string) {
    const fileNameTokens = filePath.split(path.sep);
    const fileName = fileNameTokens[fileNameTokens.length - 1];

    const extension = fileName.split('.').pop();
    if (extension && COMMON_REPO_BINARY_FILE_EXTENSIONS.includes(extension)) {
      if (verbose()) log(`Skipping binary file: ${filePath}`);
      return;
    }

    try {
      const terms = queryKeywords(fileNameTokens).join(' ');

      if (verbose()) console.log(`Indexing file path ${filePath} with terms ${terms}`);

      this.database
        .prepare('INSERT INTO files (directory, file_name, terms) VALUES (?, ?, ?)')
        .run(directory, filePath, terms);
    } catch (error) {
      console.warn(`Error indexing document ${filePath}`);
      console.warn(error);
    }
  }
}

export function restoreFileIndex(indexFileName: string): FileIndex {
  assert(existsSync(indexFileName), `Index file ${indexFileName} does not exist`);
  const database = new sqlite3(indexFileName);
  return new FileIndex(database);
}

export async function buildFileIndex(
  directories: string[],
  indexFileName: string
): Promise<FileIndex> {
  assert(!existsSync(indexFileName), `Index file ${indexFileName} already exists`);
  const database = new sqlite3(indexFileName);
  const fileIndex = new FileIndex(database);
  fileIndex.initializeIndex();
  await fileIndex.indexDirectories(directories);
  console.log(`Wrote file index to ${indexFileName}`);
  return fileIndex;
}
