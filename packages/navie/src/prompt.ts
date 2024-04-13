export enum PromptType {
  Question = 'question',
  IssueDescription = 'issueDescription',
  CodeSelection = 'codeSelection',
  AppMapConfig = 'appmapConfig',
  AppMapStats = 'appmapStats',
  SequenceDiagram = 'sequenceDiagrams',
  CodeSnippet = 'codeSnippets',
  DataRequest = 'dataRequest',
  HelpDoc = 'helpDoc',
}

const PROMPT_NAMES: Record<PromptType, { singular: string; plural: string }> = {
  [PromptType.Question]: { singular: 'question', plural: 'questions' },
  [PromptType.IssueDescription]: { singular: 'issue description', plural: 'issue descriptions' },
  [PromptType.CodeSelection]: { singular: 'code selection', plural: 'code selections' },
  [PromptType.AppMapConfig]: { singular: 'AppMap configuration', plural: 'AppMap configurations' },
  [PromptType.AppMapStats]: { singular: 'AppMap statistics', plural: 'AppMap statistics' },
  [PromptType.SequenceDiagram]: { singular: 'sequence diagram', plural: 'sequence diagrams' },
  [PromptType.CodeSnippet]: { singular: 'code snippet', plural: 'code snippets' },
  [PromptType.DataRequest]: { singular: 'data request', plural: 'data requests' },
  [PromptType.HelpDoc]: { singular: 'help document', plural: 'help documents' },
};

export type Prompt = {
  content: string;
  prefix: string;
  multiple?: boolean;
};

export const PROMPTS: Record<PromptType, Prompt> = {
  [PromptType.CodeSelection]: {
    content: `**The user's code selection**

The user is asking about specific lines of code that they have selected in their code editor.`,
    prefix: 'Code selection',
  },
  [PromptType.Question]: {
    content: `**The user's question**

This is the primary question that the user wants you to answer. Your response should be
focused primarily on answering this question.

When the user is you to create a digram, describe the code functionality in Markdown as
well as you can from the context you have. 

Avoid recommending other diagram tools such as Lucidchart, Draw.io, PlantUML, or Mermaid,
except as supplemental resources to AppMap.
`,
    prefix: 'Question',
  },
  [PromptType.IssueDescription]: {
    content: `**The code generation task**

This is a description of a code enhancement that the user wants you to help them with. Your response should be
focused primarily on solving this issue via code generation.
`,
    prefix: 'Question',
  },
  [PromptType.AppMapConfig]: {
    content: `**AppMap configuration**

You're provided with all AppMap configuration files within the user's workspace. The project information 
is encoded as an array of AppMap configurations (\`appmap.yml\`) provided in JSON format. The contents
of each element contain the configuration of the AppMap agent, including:

- **name** - The name of the project.
- **language** - The programming language of the project.
- **appmap_dir** - The directory where the AppMap files are stored. Note that this property should generally
  always be set to \`tmp/appmap\`. Don't advise the user to change this unless there are specific instructions to do so.
- **packages** - A list of code packages that should be recorded when the AppMap agent is running.

Because the workspace already contains an \`appmap.yml\` file, you don't need to describe how to install the AppMap language
library / agent. You may, however, advise the user on how to optimize this configuration for their specific needs.`,
    prefix: 'AppMap configurations',
  },
  [PromptType.AppMapStats]: {
    content: `**AppMap statistics**

You're provided with information about the AppMaps that have been recorded and are available in the user's workspace.
This information is provided as a JSON array of the following information about the AppMaps that are available within
each project:

- **name** - The name of the project.
- **packages** - A list of code packages.
- **routes** - A list of HTTP routes.
- **tables** - A list of database tables.
- **numAppMaps** - The number of AppMaps that are available in the project.`,
    prefix: 'AppMap statistics',
  },
  [PromptType.SequenceDiagram]: {
    content: `**Sequence diagrams**

You're provided with sequence diagrams that are relevant to the task.
Each sequence diagram represents the actual flow of code that was recorded by the AppMap language library
which is integrated into the project.
`,
    prefix: 'Sequence diagram',
    multiple: true,
  },
  [PromptType.CodeSnippet]: {
    content: `**Code snippets**

You're provided with code snippets that are relevant to the task. 

Sequence diagrams, if available, provide more context about how each code snippet is used in the overall program.

Each code snippet begins with the file name and line number where the code is located,
followed by the code itself.
`,
    prefix: 'Code snippet',
    multiple: true,
  },
  [PromptType.DataRequest]: {
    content: `**Data requests**

You're provided with data requests that are relevant to the task. A data request
is an outbound request to a database, API, or other data source that was made by the program.
Each data request was recorded by the AppMap language library which is integrated into the project.

Sequence diagrams, if available, provide more context about how each data request is used in the overall program.`,
    prefix: 'Data request',
    multiple: true,
  },
  [PromptType.HelpDoc]: {
    content: `**Help documents**

You're provided with relevant snippets of AppMap documentation. Each documentation snippet provides detailed
information about installing, configuring, and using AppMap.`,
    prefix: 'Help document',
    multiple: true,
  },
};

export function buildPromptDescriptor(promptType: PromptType): string {
  const prompt = PROMPTS[promptType];
  const content = [prompt.content];
  if (prompt.multiple) {
    content.push(
      `Multiple ${PROMPT_NAMES[promptType].plural} of this type will be provided. Each one will be prefixed with "[${prompt.prefix}]"`
    );
  } else {
    content.push(
      `The ${PROMPT_NAMES[promptType].singular} will be prefixed with "[${prompt.prefix}]"`
    );
  }

  return content.join('\n\n');
}

export function buildPromptValue(promptType: PromptType, value: string): string {
  const prompt = PROMPTS[promptType];
  return `[${prompt.prefix}] ${value}`;
}
