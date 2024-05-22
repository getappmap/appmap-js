import { ChatOpenAI } from '@langchain/openai';

import InteractionHistory, { CompletionEvent } from '../interaction-history';
import type Message from '../message';

export type Completion = AsyncIterable<string>;

export default interface CompletionService {
  complete: (options: { temperature: number | undefined }) => Completion;
}

// Some LLMs only accept a single system message.
// This functions merges all system messages into a single message
// at the start of the list.
function mergeSystemMessages(messages: Message[]): Message[] {
  const systemMessages = messages.filter((message) => message.role === 'system');
  const nonSystemMessages = messages.filter((message) => message.role !== 'system');
  const mergedSystemMessage = {
    role: 'system',
    content: systemMessages.map((message) => message.content).join('\n'),
  } as const;
  return [mergedSystemMessage, ...nonSystemMessages];
}

export class OpenAICompletionService implements CompletionService {
  constructor(
    public readonly interactionHistory: InteractionHistory,
    public readonly modelName: string,
    public readonly temperature: number
  ) {}

  async *complete(options: { temperature: number | undefined }): Completion {
    const { messages } = this.interactionHistory.buildState();

    const chatAI = new ChatOpenAI({
      modelName: this.modelName,
      temperature: options.temperature || this.temperature,
      streaming: true,
    });

    this.interactionHistory.addEvent(
      new CompletionEvent(this.modelName, options.temperature || this.temperature)
    );

    const response = await chatAI.completionWithRetry({
      messages: mergeSystemMessages(messages),
      model: this.modelName,
      stream: true,
    });

    for await (const token of response) {
      const content = token.choices.map((choice) => choice.delta.content).join('');
      yield content;
    }
  }
}
