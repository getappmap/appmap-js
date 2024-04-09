import AppMapIndex from '../../fulltext/AppMapIndexSQLite';
import collectContext from '../../rpc/explain/collectContext';
import { ContextResult, ContextValue } from './context-provider';

export default async function appmapProvider(
  appmapIndex: AppMapIndex,
  keywords: string[],
  charLimit: number
): Promise<ContextResult> {
  const { context } = await collectContext(appmapIndex, ['.'], undefined, keywords, charLimit);

  const result = new Array<ContextValue>();
  for (const value of context.sequenceDiagrams) {
    result.push({ type: 'sequenceDiagram', content: value });
  }
  for (const [key, value] of context.codeSnippets.entries()) {
    result.push({ type: 'codeSnippet', id: key, content: value });
  }
  for (const value of context.codeObjects) {
    result.push({ type: 'dataRequest', content: value });
  }
  return result;
}
