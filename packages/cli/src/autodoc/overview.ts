import { listProjectFiles } from '@appland/search';
import { Feature, Overview } from './types';
import { navie } from './navie';

const QUESTION = `Create a primary documentation page for the project overview and architecture.

The documentation page should include a high-level overview of the project, including the project's
features and a diagram of the system architecture.

Use the available project information to generate the documentation page. Do not include code snippets
or file paths in the documentation page.

The documentation page should be output in a format that is suitable for a project README or
documentation website.

Avoid using tentative language such as "may", "might", "could", "appears", "likely" etc.

## Title

(Title of the documentation page)

## Overview

(Summary of the project)

## Features

(Feature list with links to sub-pages)

## Resources

(Links to additional resources)
`;

const PROMPT = `Output your response in the style of a documentation page.

Don't describe back to the user the information that you're provided to generate the response,
such as "Based on the provided code snippets".

Use definitive language. Be clear and concise. Avoid using "may", "might", "could", "appears" etc.
`;

const DOC_EXTENSIONS = ['.md', '.markdown', '.rst', '.toml'];

export type OverviewOptions = {
  prompt?: string;
  docExtensions?: string[];
};

export default async function overview(
  features: Feature[],
  options = {} as OverviewOptions
): Promise<Overview> {
  // const projectFiles = await listProjectFiles('.');
  // const docExtensions = options.docExtensions ?? DOC_EXTENSIONS;
  // const docFiles = projectFiles.filter((file) => !!docExtensions.find((ext) => file.endsWith(ext)));

  const docFiles = [];

  const overviewText = await navie('.', `@explain /noprojectinfo ${QUESTION}`, {
    codeSelection: [docFiles.sort().join('\n'), features.map((f) => f.name).join('\n')].join(
      '\n\n'
    ),
    prompt: PROMPT,
  });

  const overview: Overview = {
    title: 'Overview',
    description: [
      {
        type: 'text',
        content: overviewText,
      },
      {
        type: 'diagram',
        content: 'sequenceDiagram\n  A->>B: Query\n  B->>C: Response',
      },
    ],
  };

  return Promise.resolve(overview);
}
