import configuration from '../configuration';
import { getDiffLog, getWorkingDiff } from '../../lib/git';
import processPatchset from '../../lib/processPatchset';
import INavie, { INavieProvider } from '../explain/navie/inavie';
import { UserContext } from '@appland/navie';
import isCustomWelcomeMessageEnabled from './isCustomWelcomeMessageEnabled';
import { NavieRpc } from '@appland/rpc';

interface WelcomeSuggestion {
  activity: string;
  suggestions: string[];
}

export type WelcomeMessage = NavieRpc.V2.Welcome.Response;

// We don't want to support context lookups
const NOP = () => Promise.resolve([]);
const NOP_OBJECT = () => Promise.resolve(undefined);

const DEFAULT_MESSAGE = [
  'I can help you answer questions about your codebase, create diagrams, plan solutions, generate code and tests, and review code changes.',
  '',
  'Type `@` to see a list of commands.',
].join('\n');

function parseWelcomeSuggestion(response: string): WelcomeSuggestion | undefined {
  try {
    // The only time the JSON is parsable is if Navie has sent the welcome suggestion.
    // We don't need to validate the object.
    return JSON.parse(response) as unknown as WelcomeSuggestion;
  } catch {
    return undefined;
  }
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
    .map((result) => processPatchset(result.value));
}

export async function getWelcomeSuggestion(
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

export function formatWelcomeMessage(message: WelcomeMessage): string {
  if ('message' in message) {
    return message.message;
  }

  const { activity, suggestions } = message;
  if (!activity) {
    return DEFAULT_MESSAGE;
  }

  const greeting = `It looks like you're ${activity}.`;
  const lines = [greeting, '', ...(suggestions ?? []).map((s) => `- ${s}`)];
  return lines.join('\n');
}

export async function getWelcomeMessage(
  navieProvider: INavieProvider,
  codeSelection?: string
): Promise<WelcomeMessage> {
  const navie = navieProvider(NOP, NOP, NOP, NOP_OBJECT as any);

  // Case 1: Custom welcome message may not be enabled at all
  if (!isCustomWelcomeMessageEnabled()) {
    return {
      message:
        'I can help you answer questions about your codebase, create diagrams, plan solutions, generate code and tests, and review code changes. Type `@` to see a list of commands.',
    };
  }

  // Case 2: A code selection is present - use it.
  if (codeSelection) {
    const welcomeSuggestion = await getWelcomeSuggestion(navie, [codeSelection]);
    if (welcomeSuggestion) {
      return {
        activity: welcomeSuggestion.activity,
        suggestions: welcomeSuggestion.suggestions,
      };
    }
  }

  const { projectDirectories } = configuration() ?? [];

  // Case 3: Remote Navie, no open project directories
  if (projectDirectories.length === 0) {
    const message = [
      "It looks like there's no project open in your code editor. To get started, try opening a project so I can help you more effectively.",
      '',
      'I can help you answer questions about your codebase, create diagrams, plan solutions, generate code and tests, and review code changes. Type `@` to see a list of commands.',
    ].join('\n');
    return {
      message,
    };
  }

  const diffs = await getChangeDiffs(projectDirectories);
  const hasChanges = diffs.some((diff) => diff.length > 0);

  if (!hasChanges) {
    const message = [
      "It looks like you haven't started working on a task yet, as there are no changes to your workspace or branch. To begin, you can check out a different branch or start editing files. I'll keep track of your progress, so you can return anytime for help with your task.",
      '',
      'In the meantime, I can help you answer questions about your codebase, create diagrams, plan solutions and generate code. Type `@` to see a list of commands.',
    ].join('\n');
    return {
      message,
    };
  }

  const welcomeSuggestion = await getWelcomeSuggestion(navie, diffs);
  if (!welcomeSuggestion) {
    return {
      message: DEFAULT_MESSAGE,
    };
  }

  return {
    activity: welcomeSuggestion.activity,
    suggestions: welcomeSuggestion.suggestions,
  };
}
