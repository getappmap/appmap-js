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

  export function renderItems(items: ContextItem[]) {
    const renderItem = (i: UserContext.ContextItem) => {
      // Ignore UserContext.FileItems, they've already be incorporated into the context filters.
      if (UserContext.isCodeSelectionItem(i)) {
        // TODO: decide what to do with i.location
        return i.content;
      } else if (UserContext.isCodeSnippetItem(i)) {
        return i.content;
      } else if (UserContext.isFileItem(i)) {
        return i.location;
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
          `<!-- Pinned items are snippets that I have saved from earlier in the conversation -->`,
          ...pinnedItems.map((i) => `<pinned-context>\n${renderItem(i)}\n</pinned-context>`)
        );
        if (snippets.length > 0) {
          renderedItems.push(
            `<!-- Code selections are snippets that I have selected from the code editor -->`,
            ...snippets.map((i) => `<code-selection>\n${renderItem(i)}\n</code-selection>`)
          );
        }
      }
      renderedItems.push('</user-provided-context>');
    }
    return renderedItems.join('\n');
  }
}
