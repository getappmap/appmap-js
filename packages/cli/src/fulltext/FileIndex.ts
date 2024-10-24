import { stat } from 'node:fs/promises';
import path, { join } from 'node:path';
import { readFileSync } from 'node:fs';

import sqlite3 from 'better-sqlite3';
import assert from 'assert';
import makeDebug from 'debug';
import { existsSync } from 'fs';
import minimatch from 'minimatch';

import listProjectFiles from './listProjectFiles';
import queryKeywords from './queryKeywords';
import { Git, GitState } from '../telemetry';
import listGitProjectFiles from './listGitProjectFIles';
import querySymbols from './querySymbols';
import { fileNameMatchesFilterPatterns } from './fileNameMatchesFilterPatterns';

makeDebug.formatters.a = (v) => {
  return v.join(' ');
};

const debug = makeDebug('appmap:file-index');

// enable to see all indexing terms for each file
const debugTerms = makeDebug('appmap:file-index:terms');

export type FileIndexMatch = {
  directory: string;
  fileName: string;
  score: number;
};

type ParsingOptions = {
  allowGenericParsing?: boolean;
  allowSymbols?: boolean;
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
    if (debug.enabled)
      for (const row of rows) {
        debug('Found row %s', (row as { file_name: string }).file_name);
      }
    return rows.map((row: any) => ({
      directory: row.directory,
      fileName: row.file_name,
      score: row.score,
    }));
  }

  async indexDirectories(
    directories: string[],
    excludePatterns: RegExp[] | undefined,
    includePatterns: RegExp[] | undefined,
    batchSize = 100
  ) {
    for (const directory of directories) {
      try {
        const startTime = new Date().getTime();
        const gitState = await Git.state(directory);
        const fileNames =
          gitState === GitState.Ok
            ? await listGitProjectFiles(directory)
            : await listProjectFiles(directory);

        const gitAttributes = getGitAttributes(directory);

        const filteredFileNames = await filterFiles(
          directory,
          fileNames,
          excludePatterns,
          includePatterns,
          gitAttributes
        );

        const options = {
          allowGenericParsing: fileNames.length < 15_000,
          allowSymbols: fileNames.length < 15_000,
        };

        if (options.allowSymbols) {
          debug('Symbol parsing is enabled.');
          debug(
            'Generic symbol parsing is %s',
            options.allowGenericParsing ? 'enabled.' : 'disabled.'
          );
        } else {
          debug('Symbol parsing is disabled.');
        }

        for (let i = 0; i < filteredFileNames.length; i += batchSize) {
          this.indexDirectory(directory, filteredFileNames, options, i, batchSize);

          // yield to the event loop after each chunk
          await new Promise((resolve) => setTimeout(resolve, 0));
        }

        const endTime = new Date().getTime();
        console.log(
          `Indexed ${fileNames.length} files in ${directory} in ${endTime - startTime}ms`
        );
      } catch (error) {
        console.error(`Error processing directory ${directory}:`, error);
      }
    }
  }

  private indexDirectory = this.database.transaction(
    (
      directory: string,
      fileNames: string[],
      options?: ParsingOptions,
      offset?: number,
      limit?: number
    ) => {
      const startIndex = offset ?? 0;
      const endIndex = limit ? Math.min(startIndex + limit, fileNames.length) : fileNames.length;
      for (let i = startIndex; i < endIndex; i++) {
        const fileName = fileNames[i];
        this.indexFile(directory, fileName, options);
      }
    }
  );

  #insert: sqlite3.Statement<unknown[]>;

  indexFile(directory: string, filePath: string, options: ParsingOptions = {}) {
    const { allowGenericParsing = true, allowSymbols = true } = options;
    const fileNameTokens = filePath.split(path.sep);

    try {
      let terms = queryKeywords(fileNameTokens);

      if (allowSymbols) {
        const symbols = querySymbols(path.join(directory, filePath), allowGenericParsing);
        terms = terms.concat(queryKeywords(symbols).sort());
      }

      debug('Indexing file path %s with %d terms', filePath, terms.length);
      debugTerms('Terms for path %s: %a', filePath, terms);

      this.#insert.run(directory, filePath, terms.join(' '));
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
  indexFileName: string,
  excludePatterns?: RegExp[],
  includePatterns?: RegExp[]
): Promise<FileIndex> {
  assert(!existsSync(indexFileName), `Index file ${indexFileName} already exists`);
  const database = new sqlite3(indexFileName);
  const fileIndex = new FileIndex(database);
  await fileIndex.indexDirectories(directories, excludePatterns, includePatterns);
  console.log(`Wrote file index to ${indexFileName}`);
  return fileIndex;
}

const BINARY_FILE_EXTENSIONS: string[] = [
  '7z',
  'aac',
  'avi',
  'bmp',
  'bz2',
  'class',
  'dll',
  'doc',
  'docx',
  'dylib',
  'ear',
  'exe',
  'eot',
  'flac',
  'flv',
  'gif',
  'gz',
  'ico',
  'jar',
  'jpeg',
  'jpg',
  'js.map',
  'min.js',
  'min.css',
  'mkv',
  'mo',
  'mov',
  'mp3',
  'mp4',
  'mpg',
  'odt',
  'odp',
  'ods',
  'ogg',
  'otf',
  'pdf',
  'po',
  'png',
  'ppt',
  'pptx',
  'pyc',
  'rar',
  'rtf',
  'so',
  'svg',
  'tar',
  'tiff',
  'ttf',
  'wav',
  'webm',
  'webp',
  'woff',
  'woff2',
  'wmv',
  'xls',
  'xlsx',
  'xz',
  'yarn.lock',
  'zip',
].map((ext) => '.' + ext);

const DATA_FILE_EXTENSIONS: string[] = [
  'csv',
  'dat',
  'log',
  'json',
  'tsv',
  'yaml',
  'yml',
  'xml',
].map((ext) => '.' + ext);

const isBinaryFile = (fileName: string, gitAttributes?: ReturnType<typeof getGitAttributes>) =>
  BINARY_FILE_EXTENSIONS.some((ext) => fileName.endsWith(ext)) ||
  gitAttributes?.some((attr) => attr.binary && minimatch(fileName, attr.pattern, { dot: true }));

const isDataFile = (fileName: string) => {
  return DATA_FILE_EXTENSIONS.some((ext) => fileName.endsWith(ext));
};

export async function filterFiles(
  directory: string,
  fileNames: string[],
  excludePatterns?: RegExp[],
  includePatterns?: RegExp[],
  gitAttributes?: ReturnType<typeof getGitAttributes>
): Promise<string[]> {
  const result: string[] = [];
  for (const fileName of fileNames) {
    if (isBinaryFile(fileName, gitAttributes)) continue;

    const includeFile = fileNameMatchesFilterPatterns(fileName, includePatterns, excludePatterns);
    if (!includeFile) continue;

    let appendFile = false;
    try {
      const stats = await stat(join(directory, fileName));
      if (stats.isFile()) {
        appendFile = true;
        if (stats.size > 50_000) {
          if (isDataFile(fileName)) {
            debug('Skipping large data file %s with size %d', fileName, stats.size);
            appendFile = false;
          } else {
            debug('WARNING Large file %s with size %d', fileName, stats.size);
          }
        }
      }
    } catch (error) {
      console.warn(`Error checking file ${fileName}`);
      console.warn(error);
    }

    if (appendFile) result.push(fileName);
  }
  return result;
}

// Reads git attribute patterns from a .gitattributes file.
export function getGitAttributes(directory: string) {
  const gitAttributesPath = join(directory, '.gitattributes');
  if (!existsSync(gitAttributesPath)) return [];

  const gitAttributesContent = readFileSync(gitAttributesPath, 'utf-8');
  const lines = gitAttributesContent.split('\n').filter(Boolean);

  return lines.map((line) => {
    const [pattern, ...attributes] = line.split(/\s+/);
    return {
      pattern,
      binary: attributes.includes('binary'),
    };
  });
}
