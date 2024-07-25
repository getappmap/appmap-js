import { ContextV2 } from '@appland/navie';
import { FileIndexMatch } from '../../fulltext/FileIndex';
import withIndex from '../../fulltext/withIndex';
import { SourceIndexMatch, buildSourceIndex } from '../../fulltext/SourceIndex';
import { CHARS_PER_SNIPPET } from './collectContext';

export default class SourceCollector {
  constructor(private keywords: string[], private fileSearchResponse: FileIndexMatch[]) {}

  async collectContext(charLimit: number): Promise<ContextV2.ContextItem[]> {
    const sourceIndexDocuments = await withIndex(
      'source',
      (indexFileName: string) => buildSourceIndex(indexFileName, this.fileSearchResponse),
      (index) => index.search(this.keywords, Math.round(charLimit / CHARS_PER_SNIPPET))
    );

    const buildLocation = (doc: SourceIndexMatch) => {
      return `${doc.fileName}:${doc.from}-${doc.to}`;
    };

    return sourceIndexDocuments.map((doc: SourceIndexMatch) => ({
      directory: doc.directory,
      type: ContextV2.ContextItemType.CodeSnippet,
      content: doc.content,
      location: buildLocation(doc),
    }));
  }
}
