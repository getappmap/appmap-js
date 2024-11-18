import { warn } from 'console';
import { parseJSON } from '@appland/navie';
import { listProjectFiles } from '@appland/search';

import { Feature } from './types';
import { navie } from './navie';
import { verbose } from '../utils';

const PROMPT = `## List Features

Your task is to list the features of the application. Use the available project information to
list the features of the project.

A feature can be a user-facing feature, a technical feature, a system feature, or a utility.
Basically, if there is a group of code that works together to accomplish a task, or provide some
capability, it is a feature.

## Evaluating importance

The most important features are those that have the biggest impact on data creation, data flow,
and persistence. They are the features that are most likely to be used by the end user, or
exposed by an API or CLI.

## Output Format

Output your response as a JSON list. Use a slug-like format for the feature names.

## Example

\`\`\`json
[
  "user-autentication",
  "user-profile-management",
  "command-line-tools",
  "schema-management"
]
\`\`\`  
`;

export type ListFeatureOptions = {
  knownFeatures: string[];
  prompt?: string;
  includePatterns?: RegExp[];
  excludePatterns?: RegExp[];
  filter?: string;
};

/**
 * Enumerate the features of the application. This is accomplished by ingesting global metadata
 * of the application such as the project configuration files, dependency manifests, file tree,
 * etc. Code and file details are not included in this enumeration, because only a high-level
 * overview of the application is needed.
 *
 * @param prompt A textual explanation of how to use the available project information to list the features of the project.
 */
export default async function listFeatures(options = {} as ListFeatureOptions): Promise<Feature[]> {
  let projectFiles = await listProjectFiles('.');

  if (options.includePatterns)
    projectFiles = projectFiles.filter((file) =>
      options.includePatterns?.some((pattern) => pattern.test(file))
    );

  if (options.excludePatterns)
    projectFiles = projectFiles.filter(
      (file) =>
        options.excludePatterns && !options.excludePatterns.some((pattern) => pattern.test(file))
    );

  const prompt = [PROMPT];
  prompt.push(`## Known Features

Do not include the following features in your output, since they are already known:

<features>
${options.knownFeatures.map((name) => `- ${name}`).join('\n')}
</features>

When you detect a feature that is similar to one of these features, just skip 
emission of the feature.
`);
  if (options.prompt) prompt.push(options.prompt);

  const command = '@explain /noprojectinfo /nocontext';
  let question: string;
  if (options.filter) question = `Enumerate ten (10) sub-featurse of "${options.filter}".`;
  else question = 'Enumerate ten (10) of the most important features in the code base.';

  const featureStr = await navie('.', [command, question].join(' '), {
    codeSelection: projectFiles.sort().join('\n'),
    prompt: prompt.join('\n\n'),
  });

  const features = parseJSON(featureStr, true, undefined) as undefined | string[];
  if (!features) throw new Error(`Unable to parse feature list from Navie response: ${featureStr}`);

  if (verbose()) {
    warn('Features:');
    warn(`  ${features.join('\n  ')}`);
  }

  return features.map((name) => ({ name }));
}
