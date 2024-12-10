import { NavieRpc } from '@appland/rpc';
import { RpcHandler } from '../rpc';
import configuration from '../configuration';
import { getDiffLog, getWorkingDiff } from '../../lib/git';
import INavie, { INavieProvider } from '../explain/navie/inavie';
import { UserContext } from '@appland/navie';
import isCustomWelcomeMessageEnabled from './isCustomWelcomeMessageEnabled';

interface WelcomeSuggestion {
  activity: string;
  suggestions: string[];
}

// We don't want to support context lookups
const NOP = () => Promise.resolve([]);

function parseWelcomeSuggestion(response: string): WelcomeSuggestion | undefined {
  try {
    // The only time the JSON is parsable is if Navie has sent the welcome suggestion.
    // We don't need to validate the object.
    return JSON.parse(response) as unknown as WelcomeSuggestion;
  } catch {
    return undefined;
  }
}

async function getWelcomeSuggestion(
  navie: INavie,
  diffs: string[]
): Promise<WelcomeSuggestion | undefined> {
  const userContext: UserContext.ContextItem[] = diffs.map((diff) => ({
    type: 'code-selection',
    content: diff,
  }));
  return new Promise((resolve, reject) => {
    let buffer = '';
    navie
      .on('token', (token: string) => (buffer += token))
      .on('complete', () => resolve(parseWelcomeSuggestion(buffer)))
      .on('error', reject)
      .ask(undefined, '@welcome', userContext, undefined)
      .catch(reject);
  });
}

async function getChangeDiffs(projectDirectories: string[]): Promise<string[]> {
  const diffs = await Promise.allSettled(
    [
      projectDirectories.map((d) => getDiffLog('HEAD', undefined, d)),
      projectDirectories.map((d) => getWorkingDiff(d)),
    ].flat()
  );
  return diffs
    .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
    .map((result) => result.value);
}

async function getWelcomeMessage(navieProvider: INavieProvider): Promise<string> {
  const navie = navieProvider(NOP, NOP, NOP);

  // Case 1: Custom welcome message may not be enabled at all
  if (!isCustomWelcomeMessageEnabled(navie))
    return 'I can help you answer questions about your codebase, create diagrams, plan solutions, generate code and tests, and review code changes. Type `@` to see a list of commands.';

  const result: string[] = [];
  const { projectDirectories } = configuration();

  // Case 2: Remote Navie, no open project directories
  if (projectDirectories.length === 0) {
    result.push(
      "It looks like there's no project open in your code editor. To get started, try opening a project so I can help you more effectively.",
      '',
      'I can help you answer questions about your codebase, create diagrams, plan solutions, generate code and tests, and review code changes. Type `@` to see a list of commands.'
    );
    return result.join('\n');
  }

  // Case 2: Remote Navie, check for uncommitted changes or diffs on the current branch
  const diffs = await getChangeDiffs(projectDirectories);
  const hasChanges = diffs.some((diff) => diff.length > 0);

  // Case 2a: Remote Navie, no uncommitted changes or diff on this branch
  if (!hasChanges) {
    result.push(
      "It looks like you haven't started working on a task yet, as there are no changes to your workspace or branch. To begin, you can check out a different branch or start editing files. I'll keep track of your progress, so you can return anytime for help with your task.",
      '',
      'In the meantime, I can help you answer questions about your codebase, create diagrams, plan solutions and generate code. Type `@` to see a list of commands.'
    );
    return result.join('\n');
  }

  // Case 2b: Remote Navie, changes in progress
  const welcomeSuggestion = await getWelcomeSuggestion(navie, diffs);
  if (!welcomeSuggestion) {
    // This shouldn't really ever happen, but it's possible if the LLM fails to generate a
    // structured response.
    result.push(
      'I can help you answer questions about your codebase, create diagrams, plan solutions, generate code and tests, and review code changes.',
      '',
      'Type `@` to see a list of commands.'
    );
  } else {
    result.push(
      `It looks like you're ${welcomeSuggestion.activity}.`,
      'Here are some questions you might want to try:',
      ...welcomeSuggestion.suggestions.map((s) => `- ${s}`)
    );
  }

  return result.join('\n\n');
}

export function navieMetadataV1(
  navieProvider: INavieProvider
): RpcHandler<NavieRpc.V1.Metadata.Params, NavieRpc.V1.Metadata.Response> {
  return {
    name: NavieRpc.V1.Metadata.Method,
    handler: async () => ({
      welcomeMessage: await getWelcomeMessage(navieProvider),
      inputPlaceholder: "Ask a question or enter '@' for commands",
      commands: [
        {
          name: '@explain',
          description:
            'Ask questions about the codebase, and Navie will respond with explanations, diagrams, code snippets, and more. This is the default mode.',
          referenceUrl: 'https://appmap.io/docs/reference/navie.html#explain',
        },
        {
          name: '@diagram',
          description: 'Navie can generate Mermaid diagrams based on your request.',
          referenceUrl: 'https://appmap.io/docs/reference/navie.html#diagram',
          demoUrls: [],
        },
        {
          name: '@plan',
          description: 'Create a plan to implement a solution to a code issue or feature.',
          referenceUrl: 'https://appmap.io/docs/reference/navie.html#plan',
          demoUrls: ['https://vimeo.com/985121150'],
        },
        {
          name: '@generate',
          description: 'Generate code based on a given plan.',
          referenceUrl: 'https://appmap.io/docs/reference/navie.html#generate',
          demoUrls: ['https://vimeo.com/985121150'],
        },
        {
          name: '@test',
          description: 'Write tests for your code.',
          referenceUrl: 'https://appmap.io/docs/navie-reference/navie-commands.html#test',
        },
        {
          name: '@search',
          description: 'Search your codebase with Navie.',
          referenceUrl: 'https://appmap.io/docs/navie-reference/navie-commands.html#review',
        },
        {
          name: '@review',
          description:
            'Navie will provide feedback on the changes in your current branch. Use /base=<ref> to specify the base reference.',
          referenceUrl: 'https://appmap.io/docs/navie-reference/navie-commands.html#search',
        },
        {
          name: '@help',
          description: 'Get help with AppMap and Navie AI.',
          referenceUrl: 'https://appmap.io/docs/reference/navie.html#help',
        },
      ],
    }),
  };
}
