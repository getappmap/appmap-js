import { ChatOpenAI } from '@langchain/openai';

import InteractionHistory, { CompletionEvent } from '../interaction-history';
import completion from '../lib/completion';

export type Completion = AsyncIterable<string>;

export default interface CompletionService {
  complete: (options: { temperature: number | undefined }) => Completion;
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

    yield* completion(chatAI, messages);
  }
}
