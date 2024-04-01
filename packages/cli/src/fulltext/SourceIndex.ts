import { readFile, writeFile } from 'fs/promises';
import { executeCommand } from '../lib/executeCommand';
import {
  RecursiveCharacterTextSplitter,
  SupportedTextSplitterLanguage,
} from 'langchain/text_splitter';
import lunr from 'lunr';
import { log } from 'console';

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
  id: string;
  text: string;
};

export class SourceIndex {
  index: lunr.Index | undefined;

  async execute(): Promise<lunr.Index> {
    const documents = new Array<SourceIndexDocument>();
    const projectFiles = await SourceIndex.listGitProjectFiles();
    for (const fileName of projectFiles) {
      await this.indexDocument(fileName, documents);
    }

    this.index = lunr(function () {
      this.ref('id');
      this.field('text');

      for (const doc of documents) this.add(doc);
    });

    return this.index;
  }

  protected async indexDocument(fileName: string, documents: Array<SourceIndexDocument>) {
    const fileNameTokens = fileName.split('.');
    if (fileNameTokens.length < 2) {
      log(`Skipping file with no extension: ${fileName}`);
      return;
    }

    const extension = fileNameTokens[fileNameTokens.length - 1];
    if (COMMON_REPO_BINARY_FILE_EXTENSIONS.includes(extension)) {
      log(`Skipping binary file: ${fileName}`);
      return;
    }

    const language = Object.keys(TEXT_SPLITTER_LANGUAGE_EXTENSIONS).find((language) =>
      TEXT_SPLITTER_LANGUAGE_EXTENSIONS[language].includes(extension)
    ) as SupportedTextSplitterLanguage | undefined;
    let splitter: RecursiveCharacterTextSplitter;
    if (language) {
      splitter = RecursiveCharacterTextSplitter.fromLanguage(language);
    } else {
      console.log(`No language found for file: ${fileName}`);
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
      const id = `${fileName}:${from}-${to}`;
      documents.push({
        id,
        text: chunk.pageContent,
      });
    }
  }

  static async listGitProjectFiles() {
    // Run git ls-files to get a list of all files in the project
    const files = await executeCommand('git ls-files');
    return files.split('\n').filter(Boolean);
  }
}

export default async function indexSource(outputFile: string) {
  const sourceIndex = new SourceIndex();
  const index = await sourceIndex.execute();
  await writeFile(outputFile, JSON.stringify(index));
  console.log(`Wrote source index to ${outputFile}`);
}
