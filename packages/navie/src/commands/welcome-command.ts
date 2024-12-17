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

const WELCOME_SYSTEM_PROMPT = `## Question Suggester

You have two tasks:

1. **Identify the activity that a software developer is performing**: Analyze the information about a software developer's work in progress
  and to determine what activtiy they are currently performing.

2. **Generate suggestions and requests for the user to send to Navie AI assistant**: Based on the activity that you identified,
  generate a list of suggestion and requests that the user can ask Navie next. Your suggestions should be concise and actionable,
  referencing specific concepts from the context that you're provided. Do not provide any code snippets or other details.

The identified activity should accurately describe the task the user is working on, as detailed as possible.

Suggestions should be limited to:

a) Improve the code, tests, or documentation - These should be posed as a statement about the requirements for a change.

b) Creating diagrams - These should be posed as a statement about the requirements for a diagram.
  Supported diagram types are sequence diagram, class diagram, entity-relationship diagram (ERD) and flowchart.

Don't use an "@" command prefix in your suggestion.

Suggestions should try not to reference "changes", instead reference the specific concepts or symbols from the diff.

All string values will be rendered as Markdown to the user, so use backticks when referencing code objects.

Always consider the user to be actively making changes to the codebase, not reviewing it.`;

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
