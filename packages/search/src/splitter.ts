import {
  RecursiveCharacterTextSplitter,
  SupportedTextSplitterLanguage,
} from 'langchain/text_splitter';
import makeDebug from 'debug';
import { warn } from 'console';

export type Chunk = {
  content: string;
  startLine?: number;
  endLine?: number;
};

export type Splitter = (content: string, fileExtension: string) => PromiseLike<Chunk[]>;

const debug = makeDebug('appmap:search:splitter');

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

export function wohleDocumentSplitter(content: string, fileExtension: string): Promise<Chunk[]> {
  return Promise.resolve([
    {
      content,
      startLine: 1,
      endLine: content.split('\n').length,
    },
  ]);
}

export async function langchainSplitter(content: string, fileExtension: string): Promise<Chunk[]> {
  const language = Object.keys(TEXT_SPLITTER_LANGUAGE_EXTENSIONS).find((language) =>
    TEXT_SPLITTER_LANGUAGE_EXTENSIONS[language as SupportedTextSplitterLanguage].includes(
      fileExtension
    )
  ) as SupportedTextSplitterLanguage | undefined;
  let splitter: RecursiveCharacterTextSplitter;
  if (language) {
    splitter = RecursiveCharacterTextSplitter.fromLanguage(language);
  } else {
    debug('No language found for extension: %s', fileExtension);
    splitter = new RecursiveCharacterTextSplitter();
  }
  const documents = await splitter.createDocuments([content]);

  // metadata includes:
  // { loc: { lines: { from: 1, to: 14 } } }

  return documents.map((doc) => {
    const lines = doc.metadata?.loc?.lines;
    const result: Chunk = {
      content: doc.pageContent,
    };
    if (lines) {
      result.startLine = lines.from;
      result.endLine = lines.to;
    }
    return result;
  });
}
