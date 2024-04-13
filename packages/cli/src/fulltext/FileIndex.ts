import { log } from 'console';
import sqlite3 from 'better-sqlite3';
import assert from 'assert';
import { existsSync } from 'fs';

import { executeCommand } from '../lib/executeCommand';
import { isFile, verbose } from '../utils';
import queryKeywords from './queryKeywords';
import path, { join } from 'path';

const COMMON_REPO_BINARY_FILE_EXTENSIONS: string[] = [
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
];

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
      const fileNames = await FileIndex.listGitProjectFiles(directory);
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

  // Run git ls-files and git status to get a list of all git-managed files. By doing it this way,
  // we automatically apply any .gitignore rules.
  static async listGitProjectFiles(directory: string) {
    const lsFiles = async (): Promise<string[]> => {
      const gitFiles = (
        await executeCommand('git ls-files', verbose(), verbose(), verbose(), [0], directory)
      ).split('\n');
      return gitFiles.filter(Boolean);
    };
    const statusFiles = async (): Promise<string[]> => {
      return (
        await executeCommand(
          'git status --porcelain',
          verbose(),
          verbose(),
          verbose(),
          [0],
          directory
        )
      )
        .split('\n')
        .map((line) => {
          const [, fileName] = line.split(' ');
          return fileName;
        });
    };

    const result = new Set<string>();
    // TODO: Boost new and modified files.
    for (const file of [...(await lsFiles()), ...(await statusFiles())]) {
      if (!file) {
        continue;
      }
      const filePath = join(directory, file);
      if (await isFile(filePath)) {
        result.add(file);
      }
    }

    return [...result].sort();
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
