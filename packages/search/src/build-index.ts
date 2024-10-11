import makeDebug from 'debug';
import { join } from 'path';

import FileIndex from './file-index';
import { readFileSync } from 'fs';

export type ListFn = (path: string) => Promise<string[]>;

export type FilterFn = (path: string) => PromiseLike<boolean>;

const debug = makeDebug('appmap:search:build-index');

export type Tokenizer = (
  content: string,
  fileExtension: string
) => { symbols: string[]; words: string[] };

type Context = {
  fileIndex: FileIndex;
  baseDirectory: string;
  listDirectory: ListFn;
  fileFilter: FilterFn;
  tokenizer: Tokenizer;
};

const readFileSafe = (filePath: string) => {
  try {
    return readFileSync(filePath, 'utf8');
  } catch (error) {
    debug(`Error reading file: %s`, filePath);
    return undefined;
  }
};

function indexFile(context: Context, filePath: string) {
  const fileContents = readFileSafe(filePath);
  if (!fileContents) return;

  const tokens = context.tokenizer(fileContents, filePath);
  const symbols = tokens.symbols.join(' ');
  const words = tokens.words.join(' ');

  context.fileIndex.indexFile(context.baseDirectory, filePath, symbols, words);
}

async function indexDirectory(context: Context, directory: string) {
  const dirContents = await context.listDirectory(directory);
  if (!dirContents) return;

  for (const dirContentItem of dirContents) {
    const filePath = join(directory, dirContentItem);
    debug('Indexing: %s', filePath);

    if (await context.fileFilter(filePath)) {
      indexFile(context, filePath);
    }
  }
}

export default async function buildIndex(
  fileIndex: FileIndex,
  directories: string[],
  listDirectory: ListFn,
  fileFilter: FilterFn,
  tokenizer: Tokenizer
): Promise<void> {
  for (const directory of directories) {
    const context: Context = {
      fileIndex,
      baseDirectory: directory,
      listDirectory,
      fileFilter,
      tokenizer,
    };
    await indexDirectory(context, directory);
  }
}
