import { Tokenizer } from './build-file-index';
import { ContentReader } from './ioutil';
import SnippetIndex, { SnippetId } from './snippet-index';
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
  const fileContent = await context.contentReader(file.filePath);
  if (!fileContent) return;

  const extension = file.filePath.split('.').pop() || '';
  const chunks = await context.splitter(fileContent, extension);

  chunks.forEach((chunk) => {
    const { content, startLine } = chunk;
    const id = [file.filePath, startLine].filter(Boolean).join(':');
    const snippetId: SnippetId = {
      type: 'code-snippet',
      id,
    };
    context.snippetIndex.indexSnippet(
      snippetId,
      file.directory,
      context.tokenizer(content, file.filePath).symbols.join(' '),
      context.tokenizer(content, file.filePath).words.join(' '),
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
