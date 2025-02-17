import { join } from 'node:path';
import InteractionHistory, { ContextItemEvent } from './interaction-history';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace UserContext {
  export type CodeSelectionItem = {
    type: 'code-selection';
    content: string;
  };

  export type LocationItem<T = any> = {
    type: T;
    location?: string;
  };

  export type CodeSnippetItem = LocationItem<'code-snippet'> & {
    content: string;
  };

  export type FileItem = LocationItem<'file'>;

  // A specific item provided by the user
  export type ContextItem = CodeSelectionItem | CodeSnippetItem | FileItem;
  export type Context = string | ContextItem[];

  export function isCodeSelectionItem(i: ContextItem): i is CodeSelectionItem {
    return i.type === 'code-selection';
  }

  export function isCodeSnippetItem(i: ContextItem): i is CodeSnippetItem {
    return i.type === 'code-snippet';
  }

  export function isFileItem(i: ContextItem): i is FileItem {
    return i.type === 'file';
  }

  export function hasLocation(i: ContextItem): i is LocationItem & { location: string } {
    return 'location' in i && i.location !== undefined;
  }

  export interface ContextItemOptions {
    includeContent?: boolean;

    // TODO: I really shouldn't be coupled to the interaction history. Ideally the context
    // items should already be in a form that can be directly rendered.
    interactionHistory?: InteractionHistory;
  }

  export function renderItems(items: ContextItem[], opts?: ContextItemOptions): string {
    const options = { includeContent: true, ...opts };
    const renderItem = (i: UserContext.ContextItem) => {
      if (UserContext.isCodeSelectionItem(i) && options.includeContent) {
        return `<code-selection>\n${i.content}\n</code-selection>`;
      } else if (UserContext.isCodeSnippetItem(i)) {
        const content = options.includeContent ? `\n<content>${i.content}</content>\n'` : '';
        return `<pinned-snippet>
  <location>${i.location}</location>${content}
</pinned-snippet>`;
      } else if (UserContext.isFileItem(i)) {
        // Attempt to find the pinned item as a context item in the interaction history
        // If it's found, use its content, otherwise only the location is rendered
        const content =
          options.interactionHistory && options.includeContent
            ? options.interactionHistory.events.find((e): e is ContextItemEvent => {
                if (e.type !== 'contextItem') return false;
                const { location, directory } = e as ContextItemEvent;
                return (
                  location === i.location ||
                  join(...([directory, location].filter(Boolean) as string[])) === i.location
                );
              })?.content
            : undefined;
        return content
          ? `<pinned-file><location>${i.location}</location>\n<content>\n${content}\n</content></pinned-file>`
          : `<pinned-file><location>${i.location}</location></pinned-file>`;
      }
    };

    const renderedItems = [];
    const pinnedItems = items.filter(
      (i) => UserContext.isCodeSelectionItem(i) || UserContext.isFileItem(i)
    );
    const snippets = items.filter((i) => UserContext.isCodeSnippetItem(i));
    if (pinnedItems.length > 0 || snippets.length > 0) {
      renderedItems.push('<user-provided-context>');
      if (pinnedItems.length > 0) {
        renderedItems.push(
          `<!-- Pinned items are snippets and files that I want included in the conversation -->`,
          ...pinnedItems.map((i) => renderItem(i))
        );
        if (snippets.length > 0) {
          renderedItems.push(
            `<!-- Code selections are snippets that I have selected from the code editor -->`,
            ...snippets.map((i) => renderItem(i))
          );
        }
      }
      renderedItems.push('</user-provided-context>');
    }
    return renderedItems.join('\n');
  }
}
