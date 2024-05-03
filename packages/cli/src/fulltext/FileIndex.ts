import { stat } from 'node:fs/promises';
import path, { join } from 'node:path';

import sqlite3 from 'better-sqlite3';
import assert from 'assert';
import { existsSync } from 'fs';

import { verbose } from '../utils';
import listProjectFiles from './listProjectFiles';
import queryKeywords from './queryKeywords';
import { Git, GitState } from '../telemetry';
import listGitProjectFiles from './listGitProjectFIles';

export type FileIndexMatch = {
  directory: string;
  fileName: string;
  score: number;
};

export class FileIndex {
  constructor(public database: sqlite3.Database) {
    this.database.exec(
      `CREATE VIRTUAL TABLE files USING fts5(directory UNINDEXED, file_name UNINDEXED, terms, tokenize = 'porter unicode61')`
    );
    this.database.pragma('journal_mode = OFF');
    this.database.pragma('synchronous = OFF');
    this.#insert = this.database.prepare(
      'INSERT INTO files (directory, file_name, terms) VALUES (?, ?, ?)'
    );
  }

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

  async indexDirectories(directories: string[]) {
    for (const directory of directories) {
      const gitState = await Git.state(directory);

      let fileNames: string[];
      if (gitState === GitState.Ok) {
        fileNames = await listGitProjectFiles(directory);
      } else {
        fileNames = await listProjectFiles(directory);
      }
      this.#indexDirectory(directory, await filterFiles(directory, fileNames));
    }
  }

  #indexDirectory = this.database.transaction((directory: string, fileNames: string[]) => {
    for (const fileName of fileNames) {
      this.indexFile(directory, fileName);
    }
  });

  #insert: sqlite3.Statement<unknown[]>;

  indexFile(directory: string, filePath: string) {
    const fileNameTokens = filePath.split(path.sep);

    try {
      const terms = queryKeywords(fileNameTokens).join(' ');

      if (verbose()) console.log(`Indexing file path ${filePath} with terms ${terms}`);

      this.#insert.run(directory, filePath, terms);
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
  await fileIndex.indexDirectories(directories);
  console.log(`Wrote file index to ${indexFileName}`);
  return fileIndex;
}

const BINARY_FILE_EXTENSIONS: string[] = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'bmp',
  'ico',
  'tiff',
  'webp',
  'svg',
  'mp3',
  'wav',
  'ogg',
  'flac',
  'aac',
  'mp4',
  'webm',
  'mkv',
  'avi',
  'mov',
  'wmv',
  'mpg',
  'flv',
  'zip',
  'tar',
  'gz',
  'bz2',
  'xz',
  '7z',
  'rar',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'odt',
  'ods',
  'odp',
  'rtf',
  'woff',
  'woff2',
  'eot',
  'ttf',
  'otf',
  'ico',
  'flv',
  'avi',
  'mov',
  'wmv',
  'mpg',
  'jar',
  'war',
  'ear',
  'class',
  'so',
  'dll',
  'exe',
  'min.js',
  'min.css',
].map((ext) => '.' + ext);

export async function filterFiles(directory: string, fileNames: string[]): Promise<string[]> {
  const result: string[] = [];
  for (const fileName of fileNames) {
    if (BINARY_FILE_EXTENSIONS.some((ext) => fileName.toLowerCase().endsWith(ext))) continue;
    try {
      const stats = await stat(join(directory, fileName));
      if (stats.isFile() && stats.size < 50000) result.push(fileName);
    } catch (error) {
      console.warn(`Error checking file ${fileName}`);
      console.warn(error);
    }
  }
  return result;
}
