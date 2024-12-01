import { ContextV2 } from '@appland/navie';
import {
  parseFileChunkSnippetId,
  SessionId,
  SnippetIndex,
  SnippetSearchResult,
} from '@appland/search';
import { CHARS_PER_SNIPPET } from './collect-context';

export default function collectSnippets(
  snippetIndex: SnippetIndex,
  sessionId: SessionId,
  query: string,
  charLimit: number
): ContextV2.ContextResponse {
  const snippets = snippetIndex.searchSnippets(
    sessionId,
    query,
    Math.round(charLimit / CHARS_PER_SNIPPET)
  );

  const buildLocation = (result: SnippetSearchResult) => {
    const snippetId = parseFileChunkSnippetId(result.snippetId);
    const { filePath, startLine } = snippetId;
    return [filePath, startLine].filter(Boolean).join(':');
  };

  return snippets.map((snippet) => ({
    directory: snippet.directory,
    type: ContextV2.ContextItemType.CodeSnippet,
    content: snippet.content,
    location: buildLocation(snippet),
  }));
}
