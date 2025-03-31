export type PinEvent = {
  pinned: boolean;
  uri: string;
};

export type PinItem = {
  type: string;
};

// These map to prop types for each context item
export type PinMermaid = PinItem & {
  type: 'mermaid';
  content: string;
};

export type PinCodeSnippet = PinItem & {
  type: 'code-snippet';
  language: string;
  location: string;
  content: string;
};

export type PinFile = PinItem & {
  type: 'file';
  content: string;
};

export type PinEvents = PinEvent & (PinMermaid | PinCodeSnippet | PinFile);
