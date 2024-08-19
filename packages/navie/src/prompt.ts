export enum PromptType {
  Question = 'question',
  IssueDescription = 'issueDescription',
  ProblemStatement = 'problemStatement',
  CodeSelection = 'codeSelection',
  AppMapConfig = 'appmapConfig',
  AppMapStats = 'appmapStats',
  SequenceDiagram = 'sequenceDiagrams',
  CodeSnippet = 'codeSnippets',
  DataRequest = 'dataRequest',
  HelpDoc = 'helpDoc',
  CodeEditor = 'codeEditor',
  ConversationSummary = 'conversationSummary',
}

const PROMPT_NAMES: Record<PromptType, { singular: string; plural: string }> = {
  [PromptType.Question]: { singular: 'question', plural: 'questions' },
  [PromptType.IssueDescription]: { singular: 'issue description', plural: 'issue descriptions' },
  [PromptType.ProblemStatement]: { singular: 'problem statement', plural: 'problem statements' },
  [PromptType.CodeSelection]: { singular: 'code selection', plural: 'code selections' },
  [PromptType.AppMapConfig]: { singular: 'AppMap configuration', plural: 'AppMap configurations' },
  [PromptType.AppMapStats]: { singular: 'AppMap statistics', plural: 'AppMap statistics' },
  [PromptType.SequenceDiagram]: { singular: 'sequence diagram', plural: 'sequence diagrams' },
  [PromptType.CodeSnippet]: { singular: 'code snippet', plural: 'code snippets' },
  [PromptType.DataRequest]: { singular: 'data request', plural: 'data requests' },
  [PromptType.HelpDoc]: { singular: 'help document', plural: 'help documents' },
  [PromptType.CodeEditor]: { singular: 'code editor', plural: 'code editors' },
  [PromptType.ConversationSummary]: {
    singular: 'conversation summary',
    plural: 'conversation summary',
  },
};

export type Prompt = {
  content: string;
  tagName: string;
  multiple?: boolean;
};

export const PROMPTS: Record<PromptType, Prompt> = {
  [PromptType.CodeSelection]: {
    content: `**The user's code selection**

The user is asking about specific lines of code that they have selected in their code editor.`,
    tagName: 'code-selection',
  },
  [PromptType.Question]: {
    content: `**The user's question**

This is the primary question that the user wants you to answer. Your response should be
focused primarily on answering this question.
`,
    tagName: 'question',
  },
  [PromptType.IssueDescription]: {
    content: `**The code generation task**

This is a description of a code enhancement that the user wants you to help them with. Your response should be
focused primarily on solving this issue via code generation. If this field is blank, the user expects you to use
the conversation history to generate code.
`,
    tagName: 'issue-description',
  },
  [PromptType.ProblemStatement]: {
    content: `**The problem statement**
This is a description of the problem that the user wants you to help them with. Your response should be
focused on describing the problem fully as a software Issue, aka Ticket.
`,
    tagName: 'problem-statement',
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
    tagName: 'appmap-config',
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
    tagName: 'appmap-stats',
  },
  [PromptType.SequenceDiagram]: {
    content: `**Sequence diagrams**

You're provided with sequence diagrams that are relevant to the task.
Each sequence diagram represents the actual flow of code that was recorded by the AppMap language library
which is integrated into the project.
`,
    tagName: 'sequence-diagram',
    multiple: true,
  },
  [PromptType.CodeSnippet]: {
    content: `**Code snippets**

You're provided with code snippets that are relevant to the task.

Sequence diagrams, if available, provide more context about how each code snippet is used in the overall program.

Each code snippet begins with the file name and line number where the code is located,
followed by the code itself.

When referencing a code snippet in your response, provide the file name as an HTML-style block comment before the code block.
This specific comment directive will give the user the ability to apply to code snippet automatically.
The file path will automatically be rendered relative to the project directory in the user's view.

ALWAYS place the comment directive immediately before the code block.
ALWAYS specify an absolute path, formed by joining the project directory with the location of the code snippet.
ALWAYS specify the code language on the code block.

Examples:

<!-- file: /home/user/dev/my-project/app/models/user.rb -->
\`\`\`ruby
class User < ApplicationRecord
end
\`\`\`

<!-- file: C:\\Users\\me\\My Documents\\other-project\\src\\main.cpp -->
\`\`\`cpp
#include <iostream>
int main() {
  std::cout << "Hello, world!" << std::endl;
  return 0;
}
\`\`\`

<!-- file: /home/user/dev/blog/src/index.js -->
\`\`\`js
const app = require('express')();
app.get('/', (req, res) => res.send('Hello, world!'));
app.listen(3000, () => console.log('Server started on port 3000'));
\`\`\`
`,
    tagName: 'code-snippet',
    multiple: true,
  },
  [PromptType.DataRequest]: {
    content: `**Data requests**

You're provided with data requests that are relevant to the task. A data request
is an outbound request to a database, API, or other data source that was made by the program.
Each data request was recorded by the AppMap language library which is integrated into the project.

Sequence diagrams, if available, provide more context about how each data request is used in the overall program.`,
    tagName: 'data-request',
    multiple: true,
  },
  [PromptType.HelpDoc]: {
    content: `**Help documents**

You're provided with relevant snippets of AppMap documentation. Each documentation snippet provides detailed
information about installing, configuring, and using AppMap.`,
    tagName: 'help-doc',
    multiple: true,
  },
  [PromptType.CodeEditor]: {
    content: `**Code editor**

You're provided with information about the user's code editor, in which you run as an AI assistant via a plugin.
Do not mention installation or activation of the AppMap extension, because the user has already accomplished these steps.`,
    tagName: 'code-editor',
  },
  [PromptType.ConversationSummary]: {
    content: `**Conversation summary**

You're provided with a summary of the entire conversation history.`,
    tagName: 'conversation-summary',
    multiple: false,
  },
};

export function buildPromptDescriptor(promptType: PromptType): string {
  const prompt = PROMPTS[promptType];
  const content = [prompt.content];

  if (prompt.multiple) {
    content.push(
      `Multiple ${PROMPT_NAMES[promptType].plural} of this type will be provided within the context. Each will be wrapped in a \`<${prompt.tagName}>\` tag.`
    );
  } else {
    content.push(
      `The ${PROMPT_NAMES[promptType].singular} will be provided as context within a \`<${prompt.tagName}>\` tag.`
    );
  }

  return content.join('\n\n');
}

export function buildPromptValue(promptType: PromptType, value: string): string {
  const prompt = PROMPTS[promptType];
  return [`<${prompt.tagName}>`, value, `</${prompt.tagName}>`].join('\n');
}
