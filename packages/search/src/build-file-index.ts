import makeDebug from 'debug';
import { join } from 'path';

import FileIndex from './file-index';
import { ContentReader } from './ioutil';
import { warn } from 'console';

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
  contentReader: ContentReader;
  tokenizer: Tokenizer;
};

async function indexFile(context: Context, filePath: string) {
  debug('Indexing file: %s', filePath);
  const fileContents = await context.contentReader(filePath);
  if (!fileContents) return;

  debug(
    'Read file: %s, length: %d (%s...)',
    filePath,
    fileContents.length,
    fileContents.slice(0, 40)
  );
  const tokens = context.tokenizer(fileContents, filePath);
  const symbols = tokens.symbols.join(' ');
  const words = tokens.words.join(' ');

  debug('Tokenized file: %s', filePath);
  context.fileIndex.indexFile(context.baseDirectory, filePath, symbols, words);
  debug('Wrote file to index: %s', filePath);
}

async function indexDirectory(context: Context, directory: string) {
  const dirContents = await context.listDirectory(directory);
  if (!dirContents) return;

  for (const dirContentItem of dirContents) {
    const filePath = join(directory, dirContentItem);
    debug('Indexing: %s', filePath);

    if (await context.fileFilter(filePath)) {
      indexFile(context, filePath).catch((e) => {
        warn(`Error indexing file: ${filePath}`);
        warn(e);
      });
    }
  }
}

export default async function buildFileIndex(
  fileIndex: FileIndex,
  directories: string[],
  listDirectory: ListFn,
  fileFilter: FilterFn,
  contentReader: ContentReader,
  tokenizer: Tokenizer
): Promise<void> {
  for (const directory of directories) {
    const context: Context = {
      fileIndex,
      baseDirectory: directory,
      listDirectory,
      fileFilter,
      contentReader,
      tokenizer,
    };
    await indexDirectory(context, directory);
  }
}
