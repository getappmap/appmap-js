import makeDebug from 'debug';
import { isAbsolute, join } from 'path';

import FileIndex from './file-index';
import { ContentReader } from './ioutil';

export type ListFn = (path: string) => Promise<string[]>;

export type FilterFn = (path: string) => PromiseLike<boolean>;

const debug = makeDebug('appmap:search:build-index');

export type Tokenizer = (
  content: string,
  fileExtension: string
) => Promise<{ symbols: string[]; words: string[] }>;

function fileReader(
  contentReader: ContentReader,
  tokenizer: Tokenizer
): (filePath: string) => Promise<{ symbols: string[]; words: string[] } | undefined> {
  return async (filePath: string) => {
    debug('Indexing file: %s', filePath);
    const fileContents = await contentReader(filePath);
    if (!fileContents) return;

    debug(
      'Read file: %s, length: %d (%s...)',
      filePath,
      fileContents.length,
      fileContents.slice(0, 40)
    );
    const fileExtension = filePath.split('.').pop() ?? '';
    return await tokenizer(fileContents, fileExtension);
  };
}

async function* listFiles(
  directories: string[],
  fileFilter: FilterFn,
  listDirectory: ListFn
): AsyncGenerator<{ directory: string; filePath: string }> {
  for (const directory of directories) {
    const dirContents = await listDirectory(directory);
    if (!dirContents) continue;

    for (const dirContentItem of dirContents) {
      let filePath: string;
      if (isAbsolute(dirContentItem)) filePath = dirContentItem;
      else filePath = join(directory, dirContentItem);

      if (await fileFilter(filePath)) yield { directory, filePath };
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
  await fileIndex.index(
    listFiles(directories, fileFilter, listDirectory),
    fileReader(contentReader, tokenizer)
  );
}
