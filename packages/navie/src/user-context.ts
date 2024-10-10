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
}
