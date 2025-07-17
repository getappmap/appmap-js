import Command, { type CommandRequest } from '../command';
import type Message from '../message';
import type ExplainCommand from './explain-command';
import { tee } from '../lib/tee';

/** FixCommand is responsible for generating a fix for a given issue description.
 * It uses the ExplainCommand to generate a plan and then generate the code based on that plan.
 * The command is executed in two steps:
 * 1. Generate a plan for the fix based on the issue description.
 * 2. Generate the code implementation based on the plan.
 */
export default class FixCommand implements Command {
  constructor(private readonly explainCommand: ExplainCommand) {}

  /**
   * Executes the fix command.
   * @param request The command request containing the issue description and user options.
   * @param chatHistory Optional chat history to provide context for the command.
   * Note that the chat history is updated with the plan and generate prompts and responses.
   */
  async *execute(request: CommandRequest, chatHistory?: Message[]): AsyncIterable<string> {
    const issueDescription = request.question;

    const planPrompt = `@plan A concise resolution to the following issue, keeping changes to the minimum necessary. Be specific and precise in your response, and always follow best practices. Mention the relevant file paths.\n${issueDescription}`;
    const generatePrompt = '@generate Generate an implementation for the above plan.';

    const userOptions = request.userOptions.clone();
    if (!userOptions.has('classify')) userOptions.set('classify', false);
    if (!userOptions.has('gather')) userOptions.set('gather', true);

    // Note we update the chat history with the plan and generate prompts
    // to provide context for the explain command.
    chatHistory?.push({
      content: planPrompt,
      role: 'user',
    });
    let planResponse = '';

    yield '*Analyzing the issue...*\n\n';

    yield *
      tee(
        this.explainCommand.execute(
          {
            ...request,
            question: planPrompt,
            userOptions,
          },
          chatHistory
        ),
        (value) => {
          planResponse += value;
        }
      );
    chatHistory?.push({
      content: planResponse,
      role: 'assistant',
    });
    chatHistory?.push({
      content: generatePrompt,
      role: 'user',
    });

    yield '\n\n*Generating code...*\n\n';

    if (!userOptions.has('format')) userOptions.set('format', 'xml');
    userOptions.delete('gather');
    let generateResponse = '';
    yield* tee(
      this.explainCommand.execute(
        {
          ...request,
          question: generatePrompt,
          userOptions,
        },
        chatHistory
      ),
      (value) => {
        generateResponse += value;
      }
    );
    chatHistory?.push({
      content: generateResponse,
      role: 'assistant',
    });
  }
}
