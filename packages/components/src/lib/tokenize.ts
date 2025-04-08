import { URI } from '@appland/rpc';
import { pinnedItemRegistry } from './pinnedItems';

interface TagObject {
  type: 'tag';
  content: string;
  tag: string;
  attributes: [string, string][];
}

// Breaks a string token out into ordered parts, comprised of text and tags.
function parseString(input: string): (string | TagObject)[] {
  const parts: (string | TagObject)[] = [];
  // Regex to match a self-closing tag (e.g. <appmap ... />)
  const tagRegex = /(<[a-zA-Z]+\s+[^>]*\/>)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(input)) !== null) {
    // Capture any text before the tag.
    if (match.index > lastIndex) {
      parts.push(input.substring(lastIndex, match.index));
    }

    const tagContent = match[1];

    // Extract tag name (assumes tag starts with '<tagName')
    const tagNameMatch = /<([a-zA-Z]+)/.exec(tagContent);
    const tagName = tagNameMatch ? tagNameMatch[1] : '';

    // Extract attributes in the form key="value"
    const attrRegex = /(\w+)="([^"]*)"/g;
    const attributes: [string, string][] = [];
    let attrMatch: RegExpExecArray | null;
    while ((attrMatch = attrRegex.exec(tagContent)) !== null) {
      attributes.push([attrMatch[1], attrMatch[2]]);
    }

    parts.push({
      type: 'tag',
      tag: tagName,
      content: tagContent,
      attributes: attributes,
    });

    console.log(parts);
    lastIndex = tagRegex.lastIndex;
  }

  // Add any remaining text after the last tag.
  if (lastIndex < input.length) {
    parts.push(input.substring(lastIndex));
  }

  return parts;
}

/**
 * Convert a single string message into an array of tokens. This is used to break up a single static
 * message into tokens that can be rendered via the `v-user-message` component. This should only
 * be used in development or test, such as when rendering Storybook stories.
 *
 * @param identifier - A unique identifier for the message, this keeps the pinned items stable across hot reloads.
 * @param message - The message to tokenize.
 * @returns An array of tokens.
 */
export function tokenize(identifier: string, str: string): unknown[] {
  const iter = str.trim().matchAll(
    /**
     * Regex breakdown:
     *
     * 1. Optional file comment directive:
     *    (?:<!-- file: (.*) -->\r?\n)?
     *      - Matches an optional HTML-style file comment.
     *
     * 2. Code block pattern:
     *    (^`{3,}(\w*)?$(?:(?!^`{3,})(?:.|\r?\n))*(?:^`{3,})?)
     *      - Matches a code block starting with at least 3 backticks,
     *        an optional language identifier, the content, and an optional closing fence.
     *
     * 3. Fallback text:
     *    |(.*)
     *      - Catches any remaining text that isn’t part of a code block.
     */
    /(?:<!-- file: (.*) -->\r?\n)?(^`{3,}(\w*)?$(?:(?!^`{3,})(?:.|\r?\n))*(?:^`{3,})?)|(.*)/gm
  );
  const result: unknown[] = [];
  let codeBlockId = 0;
  const getCodeBlockUri = () =>
    URI.from({ scheme: 'urn', path: `${identifier}:${codeBlockId++}` }).toString();
  for (let match = iter.next(); !match.done; match = iter.next()) {
    const isCodeBlock = Boolean(match.value[2]);
    if (isCodeBlock) {
      const [, location, content, language] = match.value;

      // First, clear out any existing content for this code block.
      // This is necessary because this function may be called on hot reloads, and we don't want to
      // continuously append to the same code block.
      const uri = location ? URI.file(location).toString() : getCodeBlockUri();
      const existingItem = pinnedItemRegistry.get(uri);
      if (existingItem) {
        existingItem.content = '';
      }

      pinnedItemRegistry.appendContent(uri, content);
      pinnedItemRegistry.setMetadata(uri, 'language', language);
      pinnedItemRegistry.setMetadata(uri, 'location', location);

      result.push({ type: 'code-block', uri });
      result.push({ type: 'hidden', content });
    } else {
      const [content] = match.value;
      if (content === '') {
        result.push('\n');
      } else {
        result.push(...parseString(content));
      }
    }
  }

  return result;
}
