import { Token } from './events';

/**
 * Breaks a string token out into ordered tokens, comprised of text and objects representing XML.
 *
 * @param input - The input string containing XML-like tags.
 * @returns An array of strings and tag objects, where each tag object contains the tag name, attributes, and content.
 */
export function getTokenizedString(input: string): Token[] {
  const tokens: Token[] = [];
  // Regex to match a self-closing tag (e.g. <appmap ... />)
  const tagRegex = /(<[a-zA-Z]+\s+[^>]*\/>)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(input)) !== null) {
    // Capture any text before the tag.
    if (match.index > lastIndex) {
      tokens.push(input.substring(lastIndex, match.index));
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

    tokens.push({
      type: 'tag',
      tag: tagName,
      raw: tagContent,
      attributes: attributes,
    });

    console.log(tokens);
    lastIndex = tagRegex.lastIndex;
  }

  // Add any remaining text after the last tag.
  if (lastIndex < input.length) {
    tokens.push(input.substring(lastIndex));
  }

  return tokens;
}

function hasKey<Key extends string>(obj: unknown, key: Key): obj is Record<Key, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj;
}

export function hasCode(err: unknown): err is { code: string | number } {
  return hasKey(err, 'code') && (typeof err.code === 'string' || typeof err.code === 'number');
}

export function hasStatus(err: unknown): err is { status: string | number } {
  return (
    hasKey(err, 'status') && (typeof err.status === 'string' || typeof err.status === 'number')
  );
}

export function hasMessage(err: unknown): err is { message: string } {
  return hasKey(err, 'message') && typeof err.message === 'string';
}

export function hasNestedError(err: unknown): err is { error: { message: string } } {
  return (
    hasKey(err, 'error') && hasKey(err.error, 'message') && typeof err.error.message === 'string'
  );
}
