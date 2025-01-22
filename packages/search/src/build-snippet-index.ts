import { isAbsolute, join } from 'path';
import { Tokenizer } from './build-file-index';
import { ContentReader } from './ioutil';
import SnippetIndex, { fileChunkSnippetId } from './snippet-index';
import { Splitter } from './splitter';

export type File = {
  directory: string;
  filePath: string;
};

type Context = {
  snippetIndex: SnippetIndex;
  contentReader: ContentReader;
  splitter: Splitter;
  tokenizer: Tokenizer;
};

async function indexFile(context: Context, file: File) {
  const filePath = isAbsolute(file.filePath) ? file.filePath : join(file.directory, file.filePath);

  const fileContent = await context.contentReader(filePath);
  if (!fileContent) return;

  const extension = file.filePath.split('.').pop() || '';
  const chunks = await context.splitter(fileContent, extension);

  chunks.forEach((chunk) => {
    const { content, startLine } = chunk;
    const snippetId = fileChunkSnippetId(filePath, startLine);
    const fileExtension = file.filePath.split('.').pop() ?? '';
    const { symbols, words } = context.tokenizer(content, fileExtension);
    context.snippetIndex.indexSnippet(
      snippetId,
      file.directory,
      symbols.join(' '),
      words.join(' '),
      content
    );
  });
}

export default async function buildSnippetIndex(
  snippetIndex: SnippetIndex,
  files: File[],
  contentReader: ContentReader,
  splitter: Splitter,
  tokenizer: Tokenizer
) {
  const context = {
    snippetIndex,
    contentReader,
    splitter,
    tokenizer,
  };
  for (const file of files) {
    await indexFile(context, file);
  }
}
