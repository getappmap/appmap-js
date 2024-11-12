import { navie } from './navie';
import { Feature } from './types';

const PROMPT = `## Task

Your task is to document a feature in the style of a software architecture document. Use the
available project information to document the feature.

Document the feature from a usage point of view, not from an implementation point of view. Focus
on the design and behavior of the feature as it is used by the end user or other parts of the
system. Avoid including implementation details in the documentation. Do not provide a code
breakdown, as the user is not interested in that information.

Do not emit anything before or after the documentation content. Just emit the documentation content.

Avoid using tentative language such as "may", "might", "could", "appears", "likely" etc. Describe
only what you see from the data.
`;

export type DocumentFeatureOptions = {
  prompt?: string;
  include?: string;
  exclude?: string;
};

export default async function documentFeature(
  feature: Feature,
  options = {} as DocumentFeatureOptions
): Promise<string> {
  const prompt = [PROMPT];
  if (options.prompt) prompt.push(options.prompt);

  let command = '@explain /noprojectinfo';
  if (options.include) command += ` /include=${options.include}`;
  if (options.exclude) command += ` /exclude=${options.exclude}`;

  const featureName = feature.name.split('-').join(' ');
  const question = `Document the feature "${featureName}".`;

  return await navie('.', [command, question].join(' '), {
    prompt: prompt.join('\n\n'),
  });
}
