import { pinnedItemRegistry } from './pinnedItems';

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
  const iter = str
    .trim()
    .matchAll(
      /(?:<!-- file: (.*) -->\r?\n)?(^`{3,}(\w*)?$(?:(?!^`{3,})(?:.|\r?\n))*(?:^`{3,})?)|(.*)/gm
    );
  const result: unknown[] = [];
  const getCodeBlockId = () => `${identifier}-${codeBlockId++}`;
  let codeBlockId = 0;
  for (let match = iter.next(); !match.done; match = iter.next()) {
    const isCodeBlock = Boolean(match.value[2]);
    if (isCodeBlock) {
      const [, location, content, language] = match.value;

      // First, clear out any existing content for this code block.
      // This is necessary because this function may be called on hot reloads, and we don't want to
      // continuously append to the same code block.
      const id = getCodeBlockId();
      const existingItem = pinnedItemRegistry.get(id);
      if (existingItem) {
        existingItem.content = '';
      }

      pinnedItemRegistry.appendContent(id, content);
      pinnedItemRegistry.setMetadata(id, 'language', language);
      pinnedItemRegistry.setMetadata(id, 'location', location);

      result.push({ type: 'code-block', id });
      result.push({ type: 'hidden', content });
    } else {
      const [content] = match.value;
      if (content === '') {
        result.push('\n');
      } else {
        result.push(content);
      }
    }
  }
  console.log(result);
  return result;
}
