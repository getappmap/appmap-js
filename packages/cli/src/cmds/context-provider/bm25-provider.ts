import { SourceIndexSQLite } from '../../fulltext/SourceIndexSQLite';
import { ContextResult, ContextValue } from './context-provider';

export default async function bm25Provider(
  sourceIndex: SourceIndexSQLite,
  keywords: string[],
  charLimit: number
): Promise<ContextResult> {
  const searchResults = await sourceIndex.search(keywords);

  const result = new Array<ContextValue>();
  let charCount = 0;
  for (const searchResult of searchResults) {
    const type = 'codeSnippet';
    // TODO: Select the score from the code_snippets table
    // const { score } = searchResult;
    const { ref: id, text: content } = searchResult;
    result.push({ id, type, content });
    charCount += content.length;
    if (charCount > charLimit) break;
  }
  return result;
}
