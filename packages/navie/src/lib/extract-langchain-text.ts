import type { MessageContent } from '@langchain/core/messages';

/**
 * Extracts and concatenates all text content from a langchain message content (array).
 */
export default function extractLangchainText(content: MessageContent): string {
  if (typeof content === 'string') return content;
  return content
    .map((c) =>
      // intentionally ignore other content types like images, code, etc. since we only want text
      c.type === 'text' && 'text' in c ? String(c.text) : ''
    )
    .join('');
}
