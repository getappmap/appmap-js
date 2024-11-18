export type MixedContent = {
  type: 'text' | 'code' | 'diagram';
  content: string;
}[];

export type Feature = {
  name: string;
  parent?: string;
};

export function featureSearchString(feature: Feature): string {
  const tokens = [feature.name.split('-').join(' ')];
  if (feature.parent) tokens.push(feature.parent.split('-').join(' '));
  return tokens.join(', a subfeature of  ');
}

export type Document = {
  title: string;
  description: MixedContent;
};

export type Overview = Document;
