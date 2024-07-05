const buildPrompt = (
  webRelevant: boolean,
  testRelevant: boolean,
  webFramework?: string,
  testFramework?: string,
  ...promptSegments: string[]
) => {
  const promptInfo = ["@help I'm using the AppMap agent for Node.js."];
  if (webRelevant) {
    promptInfo.push(
      webFramework
        ? `My web framework is ${webFramework}.`
        : "My project doesn't use a supported web framework."
    );
  }
  if (testRelevant) {
    promptInfo.push(
      testFramework
        ? `My test framework is ${testFramework}.`
        : "My project doesn't use a supported test framework."
    );
  }
  promptInfo.push(...promptSegments);
  return promptInfo.filter(Boolean).join(' ');
};

export type NaviePromptSuggestion = {
  label: string;
  prompt: string;
};

export default function buildPrompts(
  language: string,
  editor: string,
  webFramework?: string,
  testFramework?: string
): {
  httpRequest: NaviePromptSuggestion[];
  process: NaviePromptSuggestion[];
  remote: NaviePromptSuggestion[];
  test: NaviePromptSuggestion[];
  codeBlock: NaviePromptSuggestion[];
} {
  const prettyEditorName = editor === 'vscode' ? 'Visual Studio Code' : 'JetBrains';
  return {
    httpRequest: [
      {
        label: 'How do I record a HTTP request?',
        prompt: buildPrompt(
          true,
          false,
          webFramework,
          testFramework,
          'How do I record HTTP requests to my application?'
        ),
      },
      {
        label: 'What is HTTP request recording?',
        prompt: buildPrompt(
          true,
          false,
          webFramework,
          testFramework,
          'What is HTTP request recording?'
        ),
      },
      {
        label: 'What frameworks support HTTP request recording?',
        prompt: buildPrompt(
          true,
          false,
          webFramework,
          testFramework,
          `What web frameworks support HTTP request recording in ${language}?`
        ),
      },
    ],
    process: [
      {
        label: 'How do I start a process recording?',
        prompt: buildPrompt(
          false,
          false,
          webFramework,
          testFramework,
          'How do I start a process recording to record my entire applications behavior from start to finish? Do not explain other recording methods.'
        ),
      },
      {
        label: 'What is a process recording?',
        prompt: buildPrompt(
          false,
          false,
          webFramework,
          testFramework,
          'What is a process recording?'
        ),
      },
      {
        label: 'When should I use process recording?',
        prompt: buildPrompt(
          false,
          false,
          webFramework,
          testFramework,
          `What kinds of ${language} applications benefit from process recording?`
        ),
      },
    ],
    remote: [
      {
        label: 'How do I start a remote recording?',
        prompt: buildPrompt(
          true,
          false,
          webFramework,
          testFramework,
          `How do I start a remote recording in ${prettyEditorName}?`
        ),
      },
      {
        label: 'How do I stop a remote recording?',
        prompt: buildPrompt(
          true,
          false,
          webFramework,
          testFramework,
          `How do I stop a remote recording in ${prettyEditorName}?`
        ),
      },
      {
        label: 'What is a remote recording?',
        prompt: buildPrompt(
          true,
          false,
          webFramework,
          testFramework,
          'What is a remote recording?'
        ),
      },
      {
        label: 'What frameworks support remote recording?',
        prompt: buildPrompt(
          true,
          false,
          webFramework,
          testFramework,
          `What web frameworks support remote recording in ${language}?`
        ),
      },
      {
        label: 'When whould I need remote recording?',
        prompt: buildPrompt(
          true,
          false,
          webFramework,
          testFramework,
          'When would I need to use remote recording?'
        ),
      },
    ],
    test: [
      {
        label: 'How do I record my tests?',
        prompt: buildPrompt(false, true, webFramework, testFramework, 'How do I record my tests?'),
      },
      {
        label: 'What is a test recording?',
        prompt: buildPrompt(false, true, webFramework, testFramework, 'What is a test recording?'),
      },
      {
        label: 'What testing frameworks can I record with?',
        prompt: buildPrompt(
          false,
          true,
          webFramework,
          testFramework,
          `What testing frameworks are supported for ${language}?`
        ),
      },
      {
        label: 'Why should I record my tests?',
        prompt: buildPrompt(
          false,
          true,
          webFramework,
          testFramework,
          'What is the benefit of recording tests and how does additional AppMap data help Navie understand my application?'
        ),
      },
    ],
    codeBlock: [
      {
        label: 'How do I record a code block?',
        prompt: buildPrompt(
          false,
          false,
          webFramework,
          testFramework,
          'How do I record a code block?'
        ),
      },
      {
        label: 'What is a code block recording?',
        prompt: buildPrompt(
          false,
          false,
          webFramework,
          testFramework,
          'What is a code block recording?'
        ),
      },
      {
        label: 'When would I use a code block recording?',
        prompt: buildPrompt(
          false,
          false,
          webFramework,
          testFramework,
          'When would I need to use a code block recording to record parts of my application?'
        ),
      },
    ],
  };
}
