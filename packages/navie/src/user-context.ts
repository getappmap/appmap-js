import { ContextV2 } from './context';

import ContextItemType = ContextV2.ContextItemType;

export namespace UserContext {
  export type CodeSelectionItem = {
    type: 'code-selection';
    location: string;
    content: string;
  };

  export type CodeSnippetItem = {
    type: 'code-snippet';
    content: string;
  };

  export type FileItem = {
    type: 'file';
    location: string;
  };

  // A specific item provided by the user
  export type ContextItem = CodeSelectionItem | CodeSnippetItem | FileItem;

  export function isCodeSelectionItem(i: ContextItem): i is CodeSelectionItem {
    return i.type === 'code-selection';
  }

  export function isCodeSnippetItem(i: ContextItem): i is CodeSnippetItem {
    return i.type === 'code-snippet';
  }

  export function isFileItem(i: ContextItem): i is FileItem {
    return i.type === 'file';
  }
}
