import {
  RecursiveCharacterTextSplitter,
  SupportedTextSplitterLanguage,
} from 'langchain/text_splitter';
import assert from 'assert';
import sqlite3 from 'better-sqlite3';
import { existsSync } from 'fs';
import { FileIndexMatch } from './FileIndex';
import { verbose } from '../utils';
import { readFile } from 'fs/promises';
import { join } from 'path';
import queryKeywords from './queryKeywords';

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

export type Chunk = {
  directory: string;
  fileName: string;
  from: number;
  to: number;
  content: string;
};

export class SourceIndex {
  constructor(public database: sqlite3.Database) {}

  close() {
    this.database.close();
  }

  search(keywords: string[], limit = 10): SourceIndexMatch[] {
    const query = `SELECT directory, file_name, from_line, to_line, snippet, (rank * -1) score FROM code_snippets WHERE code_snippets MATCH ? ORDER BY rank LIMIT ?`;

    const searchExpr = queryKeywords(keywords).join(' OR ');
    const rows = this.database.prepare(query).all(searchExpr, limit);
    rows.forEach((row: any) => {
      if (verbose()) console.log(`[SourceIndex] Found row ${row.file_name}`);
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

  initializeIndex() {
    this.database.exec(
      `CREATE VIRTUAL TABLE code_snippets USING fts5(directory UNINDEXED, file_name UNINDEXED, from_line UNINDEXED, to_line UNINDEXED, snippet UNINDEXED, terms, tokenize = 'porter unicode61')`
    );
  }

  async indexFiles(files: SourceIndexDocument[]): Promise<void> {
    for (const file of files) {
      await this.indexFile(file);
    }
  }

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
      if (verbose()) console.log(`No language found for file: ${fileName}`);
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

    for (const chunk of await splitter.createDocuments([fileContents])) {
      const { from, to } = chunk.metadata.loc.lines;

      this.indexChunk({
        directory,
        fileName,
        from,
        to,
        content: chunk.pageContent,
      });
    }
  }

  indexChunk(chunk: Chunk) {
    const { directory, fileName, from, to, content } = chunk;

    const filePath = join(directory, fileName);
    try {
      if (verbose()) console.log(`Indexing chunk ${filePath} from ${from} to ${to}`);

      const terms = queryKeywords([content]).join(' ');
      this.database
        .prepare(
          'INSERT INTO code_snippets (directory, file_name, from_line, to_line, snippet, terms) VALUES (?, ?, ?, ?, ?, ?)'
        )
        .run(directory, fileName, from, to, content, terms);
    } catch (error) {
      console.warn(`Error indexing document ${filePath} from ${from} to ${to}`);
      console.warn(error);
    }
  }
}

export async function buildSourceIndex(
  indexFileName: string,
  files: FileIndexMatch[],
  chunks: Chunk[]
): Promise<SourceIndex> {
  assert(!existsSync(indexFileName), `Index file ${indexFileName} already exists`);
  const database = new sqlite3(indexFileName);
  const sourceIndex = new SourceIndex(database);
  sourceIndex.initializeIndex();
  await sourceIndex.indexFiles(files);
  for (const chunk of chunks) sourceIndex.indexChunk(chunk);
  console.log(`Wrote file index to ${indexFileName}`);
  return sourceIndex;
}
