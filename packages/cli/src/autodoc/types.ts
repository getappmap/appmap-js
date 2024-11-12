export type MixedContent = {
  type: 'text' | 'code' | 'diagram';
  content: string;
}[];

export type Feature = {
  name: string;
};

export type Document = {
  title: string;
  description: MixedContent;
};

export type Overview = Document;
