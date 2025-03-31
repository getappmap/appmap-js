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

  export function hasContent(i: ContextItem): i is ContextItem & { content: string } {
    return 'content' in i && i.content !== undefined;
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
      let content: string | undefined;
      if (UserContext.hasContent(i)) {
        content = i.content;
      } else if (options.interactionHistory && options.includeContent) {
        const contextEvent = options.interactionHistory.events.find((e): e is ContextItemEvent => {
          if (e.type !== 'contextItem') return false;
          const { location, directory } = e as ContextItemEvent;
          return (
            location === i.location ||
            join(...([directory, location].filter(Boolean) as string[])) === i.location
          );
        });
        content = contextEvent?.content;
      }

      let renderedContext = `<context-item>`;
      if (UserContext.hasLocation(i)) renderedContext += `<uri>${i.location}</uri>`;
      if (content) renderedContext += `<content>${content}</content>`;
      renderedContext += '</context-item>';
      return renderedContext;
    };

    const renderedItems = [];
    if (items.length > 0) {
      renderedItems.push(
        '<user-provided-context>',
        '  <!-- Below is a list of relevant context that I have added to the conversation -->',
        '  <!-- I may refer to these as "pinned items" or similar. You can directly see my pinned items below. -->',
        ...items.map((i) => renderItem(i)),
        '</user-provided-context>'
      );
    }

    return renderedItems.join('\n');
  }
}
