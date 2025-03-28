/* eslint-disable @typescript-eslint/no-namespace */
export namespace ContextV1 {
  export type ContextRequest = {
    // A soft limit on the amount of data to return.
    tokenCount: number;
    // Keywords to match in the context items. If not specified, a sampling of the context items will be returned.
    // When a user's question is directed to specific functionality or domain area, the keywords should be used to
    // filter the context items to those that are relevant to the question. If the user's question is more general,
    // or the user is exploring the application, the keywords can be omitted to get a broader set of context items.
    vectorTerms: string[];
  };

  export type ContextItem = {
    name: string;
    score?: number;
    content: string;
  };

  export type ContextResponse = {
    sequenceDiagrams: string[];
    codeSnippets: { [key: string]: string };
    codeObjects: string[];
  };

  export type ContextProvider = (
    request: ContextRequest & { version: 1; type: 'search' }
  ) => Promise<ContextResponse>;
}

export namespace ContextV2 {
  // Describes the different types of context data that is available.
  export enum ContextItemType {
    // A summarized sequence diagram that describes the overall flow of the application.
    // The diagram is synthesized from a trace of the application's execution.
    SequenceDiagram = 'sequence-diagram',
    // A code snippet that is relevant to the context. The snippet is a few lines
    // from a source file that is related to the context.
    CodeSnippet = 'code-snippet',
    // A data request that was made by the application. This could be a database query,
    // an HTTP client request, or any other type of data request.
    DataRequest = 'data-request',
    // A help document that is relevant to the user's situation.
    HelpDoc = 'help-doc',
    // A reference to a source file
    File = 'file',
    // A selection from a source file, including the location (specified as a path
    // and range of lines), as well as the content extracted from the location
    CodeSelection = 'code-selection',
    // A directory listing
    DirectoryListing = 'directory-listing',
  }

  // A specific context item that is returned in the response.
  export type ContextItem = {
    // The type of context item.
    type: ContextItemType;
    // The content of the context item. The content is specific to the type of context item.
    content: string;
    // A score that indicates the relevance of the context item to the request. Score is present
    // only when the context item was obtained by searching for keywords (terms).
    score?: number;
  };

  export type FileContextItem = ContextItem & {
    type:
      | ContextItemType.CodeSnippet
      | ContextItemType.SequenceDiagram
      | ContextItemType.DataRequest
      | ContextItemType.DirectoryListing;
    // The directory in which the context item is located.
    directory: string;
    // Identifies the location in the project directory from which the context was obtained.
    // For example, a file path with an optional line number or range in the format "path/to/file.rb:1-2".
    // In some cases, the AppMap agent may not be able to determine the location of the context item,
    // so this field may be a best guess. In the code editor, perform a search for the file name to locate the file.
    // This will always be a relative path from the indicated directory.
    location: string;
  };

  export function isFileContextItem(contextItem: ContextItem): contextItem is FileContextItem {
    return (
      contextItem.type === ContextItemType.CodeSnippet ||
      contextItem.type === ContextItemType.SequenceDiagram ||
      contextItem.type === ContextItemType.DataRequest ||
      contextItem.type === ContextItemType.DirectoryListing
    );
  }

  export enum ContextLabelName {
    Greeting = 'greeting',
    Explain = 'explain',
    Plan = 'plan',
    Troubleshoot = 'troubleshoot',
    GenerateCode = 'generate-code',
    GenerateDiagram = 'generate-diagram',
    HelpWithAppMap = 'help-with-appmap',
    Chatting = 'chatting',

    Architecture = 'architecture',
    Feature = 'feature',
    Overview = 'overview',
  }

  export enum ContextLabelWeight {
    // The label is very relevant to the request.
    High = 'high',
    // The label is somewhat relevant to the request.
    Medium = 'medium',
    // The label is probably not relevant to the request.
    Low = 'low',
  }

  // A label that describes the nature of the user's request.
  export type ContextLabel = {
    name: ContextLabelName;
    weight: ContextLabelWeight;
  };

  export type ContextFilters = {
    // Boost recent context items. For example, if the user is asking about an event that has recently occurred, such
    // as an error or exception, or if the user is asking about code that they have recently run.
    recent?: boolean;
    // The locations of specific files to retrieve. A location is a file path with an optional
    // line number or range in the format "path/to/file.rb:1-2". This parameter can be used to obtain files that
    // are likely to exist within a framework that the user is known to be using for their application. For example,
    // a schema definition file, configuration, or routing definition.
    locations?: string[];
    // When specified, only return context items of these types.
    itemTypes?: ContextItemType[];
    // Emphasize context items that are relevant to the classification of the user's request.
    labels?: ContextLabel[];
    // Optional list of file patterns to exclude.
    exclude?: string[];
    // Optional list of file patterns to include.
    include?: string[];
  };

  // Request a set of context items from the context provider.
  export type ContextRequest = ContextV1.ContextRequest & ContextFilters;

  export type ContextResponse = Array<ContextItem | FileContextItem>;

  export type ContextProvider = (
    request: ContextRequest & { version: 2; type: 'search' }
  ) => Promise<ContextResponse>;
}
