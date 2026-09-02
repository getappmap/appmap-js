import type { MessageContent } from '@langchain/core/messages';

/**
 * Extracts the text from a langchain message content, concatenating all text parts
 * if it's a content array.
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
