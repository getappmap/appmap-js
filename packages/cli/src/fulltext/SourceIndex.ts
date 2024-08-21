import makeDebug from 'debug';
import {
  RecursiveCharacterTextSplitter,
  SupportedTextSplitterLanguage,
} from 'langchain/text_splitter';
import type { Document } from 'langchain/document';
import assert from 'assert';
import sqlite3 from 'better-sqlite3';
import { existsSync } from 'fs';
import { FileIndexMatch } from './FileIndex';
import { verbose } from '../utils';
import { readFile } from 'fs/promises';
import { join } from 'path';
import queryKeywords from './queryKeywords';

const debug = makeDebug('appmap:source-index');

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
  directory: string;
  fileName: string;
};

export type SourceIndexMatch = {
  directory: string;
  fileName: string;
  from: number;
  to: number;
  content: string;
  score: number;
};

export class SourceIndex {
  constructor(public database: sqlite3.Database) {
    this.database.exec(
      `CREATE VIRTUAL TABLE code_snippets USING fts5(directory UNINDEXED, file_name UNINDEXED, from_line UNINDEXED, to_line UNINDEXED, snippet UNINDEXED, terms, tokenize = 'porter unicode61')`
    );
    this.database.pragma('journal_mode = OFF');
    this.database.pragma('synchronous = OFF');
    this.#insert = this.database.prepare(
      'INSERT INTO code_snippets (directory, file_name, from_line, to_line, snippet, terms) VALUES (?, ?, ?, ?, ?, ?)'
    );
  }

  close() {
    this.database.close();
  }

  search(keywords: string[], limit = 10): SourceIndexMatch[] {
    const query = `SELECT directory, file_name, from_line, to_line, snippet, (rank * -1) score FROM code_snippets WHERE code_snippets MATCH ? ORDER BY rank LIMIT ?`;

    const searchExpr = queryKeywords(keywords).join(' OR ');
    debug(`[SourceIndex] Searching for ${searchExpr}`);
    const rows = this.database.prepare(query).all(searchExpr, limit);
    if (debug.enabled)
      rows.forEach((row: any) => {
        debug(`[SourceIndex] Found row ${row.file_name}`);
      });
    return rows.map((row: any) => ({
      directory: row.directory,
      fileName: row.file_name,
      from: row.from_line,
      to: row.to_line,
      content: row.snippet,
      score: row.score,
    }));
  }

  async indexFiles(files: SourceIndexDocument[]): Promise<void> {
    for (const file of files) {
      await this.indexFile(file);
    }
  }

  #insert: sqlite3.Statement<unknown[]>;

  async indexFile(file: SourceIndexDocument) {
    const { directory, fileName } = file;
    const extension = fileName.split('.').pop();

    const language = Object.keys(TEXT_SPLITTER_LANGUAGE_EXTENSIONS).find((language) =>
      TEXT_SPLITTER_LANGUAGE_EXTENSIONS[language].includes(extension)
    ) as SupportedTextSplitterLanguage | undefined;
    let splitter: RecursiveCharacterTextSplitter;
    if (language) {
      splitter = RecursiveCharacterTextSplitter.fromLanguage(language);
    } else {
      debug(`No language found for file: ${fileName}`);
      splitter = new RecursiveCharacterTextSplitter();
    }
    const filePath = join(directory, fileName);
    let fileContents: string;
    try {
      fileContents = await readFile(filePath, 'utf-8');
    } catch (error) {
      console.warn(`Error reading file ${filePath}`);
      console.warn(error);
      return;
    }

    const chunks = await splitter.createDocuments([fileContents]);
    this.#indexChunks(chunks, directory, fileName);
  }

  #indexChunks = this.database.transaction(
    (chunks: Document[], directory: string, fileName: string) => {
      for (const chunk of chunks) {
        const { from, to } = chunk.metadata.loc.lines;

        try {
          debug(`Indexing document ${fileName} from ${from} to ${to}`);

          const terms = queryKeywords([chunk.pageContent]).join(' ');
          this.#insert.run(directory, fileName, from, to, chunk.pageContent, terms);
        } catch (error) {
          console.warn(`Error indexing document ${fileName} from ${from} to ${to}`);
          console.warn(error);
        }
      }
    }
  );
}

export async function buildSourceIndex(
  indexFileName: string,
  files: FileIndexMatch[]
): Promise<SourceIndex> {
  assert(!existsSync(indexFileName), `Index file ${indexFileName} already exists`);
  const database = new sqlite3(indexFileName);
  const sourceIndex = new SourceIndex(database);
  await sourceIndex.indexFiles(files);
  console.log(`Wrote file index to ${indexFileName}`);
  return sourceIndex;
}
