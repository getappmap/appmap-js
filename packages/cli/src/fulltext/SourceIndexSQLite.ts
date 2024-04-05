import {
  RecursiveCharacterTextSplitter,
  SupportedTextSplitterLanguage,
} from 'langchain/text_splitter';
import { log } from 'console';
import sqlite3 from 'better-sqlite3';
import assert from 'assert';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

import { executeCommand } from '../lib/executeCommand';
import { verbose } from '../utils';
import queryKeywords from './queryKeywords';

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

const TEXT_SPLITTER_LANGUAGE_EXTENSIONS: Record<SupportedTextSplitterLanguage, string[]> = {
  cpp: ['cpp', 'h', 'hpp', 'c', 'cc', 'cxx', 'hxx'],
  go: ['go'],
  java: ['java', 'jsp', 'jspx'],
  js: ['js', 'ts', 'mjs', 'jsx', 'tsx', 'vue', 'svelte'],
  php: ['php'],
  proto: ['proto'],
  python: ['py'],
  rst: ['rst'],
  ruby: ['rb', 'haml', 'erb'],
  rust: ['rs'],
  scala: ['scala'],
  swift: ['swift'],
  markdown: ['md'],
  latex: ['tex'],
  html: ['html'],
  sol: ['sol'],
};

export type SourceIndexDocument = {
  ref: string;
  text: string;
};

function packRef(fileName: string, from: number, to: number) {
  return `${fileName}:${from}-${to}`;
}

export function unpackRef(ref: string): { fileName: string; from: number; to: number } {
  const [fileName, fromTo] = ref.split(':');
  const [from, to] = fromTo.split('-').map((n) => parseInt(n, 10));
  return { fileName, from, to };
}

export class SourceIndexSQLite {
  constructor(public database: sqlite3.Database) {}

  async search(keywords: string[]): Promise<SourceIndexDocument[]> {
    const query = `SELECT ref, text, terms FROM code_snippets WHERE code_snippets MATCH ? ORDER BY bm25(code_snippets, 1.0, 0.5)`;

    const searchExpr = queryKeywords(keywords).join(' OR ');
    const rows = this.database.prepare(query).all(searchExpr);
    rows.forEach((row: any) => {
      if (verbose()) console.log(`Found row ${row.ref} with terms ${row.terms}`);
    });
    return rows.map((row: any) => ({ ref: row.ref, text: row.text }));
  }

  async buildIndex() {
    this.database.exec(
      `CREATE VIRTUAL TABLE code_snippets USING fts5(ref UNINDEXED, text UNINDEXED, terms, tokenize = 'porter unicode61')`
    );

    const projectFiles = await SourceIndexSQLite.listGitProjectFiles();
    for (const fileName of projectFiles) {
      await this.indexDocument(fileName);
    }
  }

  protected async indexDocument(fileName: string) {
    const fileNameTokens = fileName.split('.');
    if (fileNameTokens.length < 2) {
      if (verbose()) log(`Skipping file with no extension: ${fileName}`);
      return;
    }

    const extension = fileNameTokens[fileNameTokens.length - 1];
    if (COMMON_REPO_BINARY_FILE_EXTENSIONS.includes(extension)) {
      if (verbose()) log(`Skipping binary file: ${fileName}`);
      return;
    }

    const language = Object.keys(TEXT_SPLITTER_LANGUAGE_EXTENSIONS).find((language) =>
      TEXT_SPLITTER_LANGUAGE_EXTENSIONS[language].includes(extension)
    ) as SupportedTextSplitterLanguage | undefined;
    let splitter: RecursiveCharacterTextSplitter;
    if (language) {
      splitter = RecursiveCharacterTextSplitter.fromLanguage(language);
    } else {
      if (verbose()) console.log(`No language found for file: ${fileName}`);
      splitter = new RecursiveCharacterTextSplitter();
    }
    let fileContents: string;
    try {
      fileContents = await readFile(fileName, 'utf-8');
    } catch (error) {
      console.warn(`Error reading file ${fileName}`);
      console.warn(error);
      return;
    }

    for (const chunk of await splitter.createDocuments([fileContents])) {
      const { from, to } = chunk.metadata.loc.lines;
      const ref = packRef(fileName, from, to);

      try {
        if (verbose()) console.log(`Indexing document ${ref}`);

        const terms = queryKeywords([chunk.pageContent]).join(' ');
        this.database
          .prepare('INSERT INTO code_snippets (ref, text, terms ) VALUES (?, ?, ?)')
          .run(ref, chunk.pageContent, terms);
      } catch (error) {
        console.warn(`Error indexing document ${ref}`);
        console.warn(error);
      }
    }
  }

  static async listGitProjectFiles() {
    // Run git ls-files to get a list of all files in the project
    const files = await executeCommand('git ls-files');
    return files.split('\n').filter(Boolean);
  }
}

export function restoreSourceIndex(textIndexFile: string): SourceIndexSQLite {
  assert(existsSync(textIndexFile), `Index file ${textIndexFile} does not exist`);
  const database = new sqlite3(textIndexFile);
  return new SourceIndexSQLite(database);
}

export async function buildSourceIndex(textIndexFile: string): Promise<SourceIndexSQLite> {
  assert(!existsSync(textIndexFile), `Index file ${textIndexFile} already exists`);
  const database = new sqlite3(textIndexFile);
  const sourceIndex = new SourceIndexSQLite(database);
  await sourceIndex.buildIndex();
  console.log(`Wrote source index to ${textIndexFile}`);
  return sourceIndex;
}
