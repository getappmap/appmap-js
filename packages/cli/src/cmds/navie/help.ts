import lunr from 'lunr';
import { Help } from '@appland/navie';
import { processFiles, verbose } from '../../utils';
import { log, warn } from 'console';
import { readFile } from 'fs/promises';
import { MarkdownTextSplitter } from 'langchain/text_splitter';
import { join } from 'path';
import { existsSync } from 'fs';
import assert from 'assert';
import { load } from 'js-yaml';

const DOCS_DIR = ['../../docs', '../../../built/docs']
  .map((dir) => join(__dirname, dir))
  .find((dir) => existsSync(dir));

export const DEFAULT_MAX_RESULTS = 10;

export function packRef(filePath: string, from: number, to: number) {
  return [filePath, from, to].join(':');
}

export function unpackRef(ref: string): [string, number, number] {
  const [filePath, from, to] = ref.split(':');
  return [filePath, parseInt(from), parseInt(to)];
}

type FrontMatter = {
  title?: string;
  name?: string;
};

export class HelpIndex {
  constructor(
    private idx: lunr.Index,
    private _frontMatterByFile: Map<string, FrontMatter>,
    private contentByRef: Map<string, string>
  ) {}

  async search(keywords: string[], maxResults = DEFAULT_MAX_RESULTS): Promise<Help.HelpDoc[]> {
    return (
      this.idx
        .search(keywords.join(' '))
        .map((result) => {
          let content = this.contentByRef.get(result.ref);
          const [filePath, from, to] = unpackRef(result.ref);
          if (!content) {
            warn(`Could not find content for ${result.ref}`);
            return;
          }

          const filePathWithoutMdSuffix = filePath.replace(/\.md$/, '');
          content = [
            `<!-- Permalink: https://appmap.io/docs/${filePathWithoutMdSuffix} -->`,
            content,
          ].join('\n');
          return {
            filePath,
            from,
            to,
            content,
            score: result.score,
          };
        })
        .filter(Boolean) as Help.HelpDoc[]
    ).slice(0, maxResults);
  }

  static async buildIndex(directory: string): Promise<HelpIndex> {
    const documents = new Array<any>();

    if (verbose()) log(`[HelpIndex] Adding help documents to full-text index`);
    const startTime = Date.now();

    const frontMatterByFile = new Map<string, FrontMatter>();
    const contentByRef = new Map<string, string>();
    const buildDocument = async (filePath: string) => {
      const document = await readFile(filePath, 'utf8');

      let [_, frontMatterStr, text] = document.split('---');
      if (!frontMatterStr) {
        frontMatterStr = '';
        text = document;
      }
      let frontMatter: FrontMatter | undefined;
      if (frontMatterStr) {
        try {
          frontMatter = load(frontMatterStr) as FrontMatter;
        } catch (e) {
          warn(`Could not parse front matter in ${filePath}`);
          warn(e);
        }
        if (frontMatter) frontMatterByFile.set(filePath, frontMatter);
      }

      const splitter = new MarkdownTextSplitter();
      // TODO: Utilize the front matter
      const chunks = await splitter.createDocuments([text]);
      for (const chunk of chunks) {
        const { from, to } = chunk.metadata.loc.lines;
        const id = packRef(filePath, from, to);
        contentByRef.set(id, chunk.pageContent);
        const pageName = frontMatter?.name || frontMatter?.title;
        documents.push({ id, pageName, content: chunk.pageContent });
      }
    };

    await processFiles(directory, (filePath: string) => filePath.endsWith('.md'), buildDocument);

    const idx = lunr(function () {
      this.ref('id');
      this.field('pageName');
      this.field('content');

      this.tokenizer.separator = /[\s/-_:#.]+/;

      for (const doc of documents) this.add(doc);
    });

    const endTime = Date.now();
    if (verbose())
      log(
        `[AppMapIndex] Added ${documents.length} AppMaps to full-text index in ${
          endTime - startTime
        }ms`
      );
    return new HelpIndex(idx, frontMatterByFile, contentByRef);
  }
}

let helpIndex: HelpIndex | undefined;

// TODO: Store the help index JSON in the distribution, so that we don't have to rebuild it when the process loads.
export function buildHelpIndex(directory: string): Promise<HelpIndex> {
  return HelpIndex.buildIndex(directory);
}

export default async function collectHelp(
  helpRequest: Help.HelpRequest
): Promise<Help.HelpResponse> {
  const { vectorTerms } = helpRequest;
  if (vectorTerms.length === 0 || vectorTerms.every((v) => v.trim() === '')) return [];

  if (!helpIndex) {
    assert(DOCS_DIR, 'Could not find AppMap docs directory');
    helpIndex = await buildHelpIndex(DOCS_DIR);
  }

  return await helpIndex.search(vectorTerms);
}
