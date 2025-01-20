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

  export function renderItems(items: ContextItem[], includeContent: boolean = true) {
    console.log('##################');
    console.log(JSON.stringify(items, null, 2));
    console.log('##################');
    const renderItem = (i: UserContext.ContextItem) => {
      if (UserContext.isCodeSelectionItem(i) && includeContent) {
        return `<code-selection>\n${i.content}\n</code-selection>`;
      } else if (UserContext.isCodeSnippetItem(i)) {
        const content = includeContent ? `\n<content>${i.content}</content>\n'` : '';
        return `<pinned-snippet>
  <location>${i.location}</location>${content}
</pinned-snippet>`;
      } else if (UserContext.isFileItem(i)) {
        return `<pinned-file><location>${i.location}</location></pinned-file>`;
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
