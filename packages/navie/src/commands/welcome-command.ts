import Command, { CommandRequest, hasCodeSelectionArray } from '../command';
import CompletionService from '../services/completion-service';
import { UserContext } from '../user-context';
import z from 'zod';

export const WelcomeSummary = z.object({
  activity: z
    .string()
    .describe(
      `The value of this field should fill in the blank to complete the sentence: "It looks like you're _____."`
    ),
  suggestions: z
    .string()
    .array()
    .describe(`A list of prompt suggestions for what the user can do next.`),
});

const WELCOME_SYSTEM_PROMPT = `Your job is to analyze the git diffs provided by the user to determine the task they are working on.
You will provide a list of prompt suggestions for what the user can ask Navie next. The prompt suggestions should be concise and actionable, referencing specific concepts from the diff. Do not provide any code snippets or other details.
Prompts should be limited to @explain or @diagram.
Prompts should try not to reference "changes", instead reference the specific concepts or symbols from the diff.
The activity should accurately describe the task the user is working on, as detailed as possible.
All string values will be rendered as Markdown to the user, so use backticks when referencing code objects.
Always consider the user to be actively making changes to the codebase, not reviewing it.
`;

const buildUserPrompt = (pinnedItems: UserContext.ContextItem[]): string =>
  pinnedItems
    .filter(UserContext.isCodeSelectionItem)
    .map((cs) => cs.content)
    .join('\n\n');

export default class WelcomeCommand implements Command {
  constructor(private readonly completionService: CompletionService) {}

  async *execute(req: CommandRequest): AsyncIterable<string> {
    if (!hasCodeSelectionArray(req)) {
      return;
    }

    const result = await this.completionService.json(
      [
        {
          role: 'system',
          content: WELCOME_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: buildUserPrompt(req.codeSelection),
        },
      ],
      WelcomeSummary,
      {
        model: this.completionService.modelName,
        temperature: 1.0,
      }
    );

    if (!result) {
      return;
    }

    // The LLM may or may not include a period at the end of the activity to complete the sentence.
    // To keep things deterministic, we'll remove it if it exists. We'll also remove any other
    // punctuation in case the LLM is feeling particularly spicy.
    result.activity = result.activity.replace(/[.!?]+$/, '');

    yield JSON.stringify(result);
  }
}
