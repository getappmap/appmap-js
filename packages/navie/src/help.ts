export type HelpRequest = {
  type: 'help';
  vectorTerms: string[];
  tokenCount: number;
};

export type HelpDoc = {
  filePath: string;
  from: number;
  to: number;
  content: string;
  score: number;
};

export type HelpResponse = HelpDoc[];

export type HelpProvider = (request: HelpRequest) => Promise<HelpResponse>;
