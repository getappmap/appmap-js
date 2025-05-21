import lunr from 'lunr';
import { Help } from '@appland/navie';
import { verbose } from '../../utils';
import { log, warn } from 'console';
import { MarkdownTextSplitter } from 'langchain/text_splitter';
import { join } from 'path';
import { load } from 'js-yaml';
import { queryKeywords } from '@appland/search';
import { glob } from 'glob';

const DOC_DIR = join(__dirname, '../../../../../docs');

const DOCS = glob.sync('**/*.md', { cwd: DOC_DIR }).reduce((memo, filePath) => {
  // How we structure the dynamic require makes a difference. Here we pull out the .md file extension
  // so that we can specify it as a static literal within the require statement below. ESBuild can
  // then optimize the bundling to only include the files we need.
  const fileName = filePath.replace(/\.md$/, '');
  memo[filePath] = require(`../../../../../docs/${fileName}.md`);
  return memo;
}, {} as Record<string, string>);

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
    // Normalize the terms. Multi-word terms will be split, and any non-alphanumeric characters will be removed.
    const terms = queryKeywords(keywords.join(' '));

    return (
      this.idx
        .search(terms.join(' '))
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

  static async buildIndex(documents: Record<string, string>): Promise<HelpIndex> {
    const processedDocuments = new Array<any>();

    if (verbose()) log(`[HelpIndex] Adding help documents to full-text index`);
    const startTime = Date.now();

    const frontMatterByFile = new Map<string, FrontMatter>();
    const contentByRef = new Map<string, string>();
    const buildDocument = async (filePath: string, content: string) => {
      let [_, frontMatterStr, text] = content.split('---');
      if (!frontMatterStr) {
        frontMatterStr = '';
        text = content;
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
        processedDocuments.push({ id, pageName, content: chunk.pageContent });
      }
    };

    for (const [filePath, content] of Object.entries(DOCS)) {
      buildDocument(filePath, content);
    }

    const idx = lunr(function () {
      this.ref('id');
      this.field('pageName');
      this.field('content');

      this.tokenizer.separator = /[\s/-_:#.]+/;

      for (const doc of processedDocuments) this.add(doc);
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

export function buildHelpIndex(documents: Record<string, string>): Promise<HelpIndex> {
  return HelpIndex.buildIndex(documents);
}

export default async function collectHelp(
  helpRequest: Help.HelpRequest
): Promise<Help.HelpResponse> {
  const { vectorTerms } = helpRequest;
  if (vectorTerms.length === 0 || vectorTerms.every((v) => v.trim() === '')) return [];

  if (!helpIndex) {
    helpIndex = await buildHelpIndex(DOCS);
  }

  return await helpIndex.search(vectorTerms);
}
