/** Scan the text for any unclosed XML tags and returns the closing tags to be appended. */
export default function closingTags(text: string): string {
  // Stack to keep track of open tags
  const openTags: string[] = [];

  // Match opening and self-closing tags
  const tagRegex = /<(\/)?([a-zA-Z]+)([^>]*?)(\/)?>/g;

  for (const match of text.matchAll(tagRegex)) {
    const [, close, tagName, attributes, selfClosing] = match;

    // Skip self-closing tags
    if (selfClosing) continue;

    // Check if this is a closing tag
    if (close || attributes.trim().startsWith('/')) {
      // Found a closing tag, remove the matching opening tag if it exists
      const lastOpenTag = openTags[openTags.length - 1];
      if (lastOpenTag === tagName) {
        openTags.pop();
      }
    } else {
      // Found an opening tag, push it onto the stack
      openTags.push(tagName);
    }
  }

  // Generate closing tags for any remaining open tags in reverse order
  return openTags
    .reverse()
    .map((tag) => `</${tag}>`)
    .join('');
}
