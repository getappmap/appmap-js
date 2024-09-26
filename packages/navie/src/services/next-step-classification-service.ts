import { z } from 'zod';
import Message from '../message';
import { ChatHistory } from '../navie';
import CompletionService from './completion-service';

const scoreSchema = z.object({
  evaluation: z.string(),
  score: z.number(),
});
const NextStepResponseFormat = z.object({
  nextSteps: z.array(
    z.object({
      command: z.enum(['generate', 'diagram', 'plan', 'test', 'explain', 'help']),
      prompt: z.string(),
      label: z.string(),
      reasoning: z.object({
        relevance: scoreSchema,
        information: scoreSchema,
        uniqueness: scoreSchema,
      }),
      overallScore: z.number(),
    })
  ),
});

export type NextStepResponse = z.infer<typeof NextStepResponseFormat>['nextSteps'];
export type NextStep = Omit<NextStepResponse[number], 'reasoning'>;

const SYSTEM_PROMPT = `Your job is to predict the next step(s) for the user given a transcript of their conversation. The transcript will contain a single question and answer, already presented to the user. The users next action will typically be in response to the assistant's answer.

## Commands
These are the actions that the user may request next:
- \`plan\`: This is useful to create step by step plans to implement a code change in the user's application.
- \`generate\`: This will generate code for the user. Always include this command if the transcript contains \`@plan\`.
- \`test\`: This action will generate test cases for the user.
- \`diagram\`: This will generate a (sequence, flow, class, entity relation) diagram for the user. This is useful for visualizing complex concepts, relationships, or processes.
- \`explain\`: This action will explain parts of the codebase or application behavior.
- \`help\`: This action will teach the user how to use AppMap Navie.

## Labels
The label is a short description of the option. It be brief and to the point. The user will see the label presented as a button. The user will have a poor experience if the label is too long. The label should reveal the key aspect of the prompt.

## Scores
The score for each option is a number between 0 and 10. A higher score indicates a higher likelihood of the option being selected.

When scoring an action, the following the following criteria should be considered:
1. Relevance: Would offering the action seem relevant to the user given the transcript?
2. Information: Is there enough information to perform the action?
4. Uniqueness: Would performing the action bring something new to the conversation? Has the user already performed the action?

## Reasoning
The reasoning section provides justification for how an action is to be scored. When providing reasoning for a score, explain why it meets the criteria above.

## Prompt
The prompt will be submitted along with the command. The command, a verb, will be the first word of the prompt. It should pair with the command to provide a request for the action on behalf of the user.

If none of the above options are applicable, return an empty array.`;

export default class NextStepClassificationService {
  constructor(private readonly completionService: CompletionService) {}

  private async getCompletion(messages: Message[]): Promise<NextStepResponse> {
    const response = await this.completionService.json(messages, NextStepResponseFormat, {
      model: this.completionService.miniModelName,
      temperature: 0.2,
    });
    return response?.nextSteps ?? [];
  }

  async getNextSteps(chatHistory: ChatHistory): Promise<NextStep[]> {
    const nextSteps = await this.getCompletion([
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: chatHistory
          .slice(-2)
          .map(({ role, content }) => `${role.toUpperCase()}:\n${content}`)
          .join('\n\n'),
      },
    ]);

    return nextSteps.map(({ command, prompt, label, overallScore }) => ({
      command,
      prompt,
      label,
      overallScore,
    }));
  }
}
