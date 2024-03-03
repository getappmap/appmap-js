import buildChatOpenAI from '../chat-openai';
import InteractionHistory, { CompletionEvent } from '../interaction-history';

export type Completion = AsyncIterable<string>;

export default interface CompletionService {
  complete: () => Completion;
}

export class OpenAICompletionService implements CompletionService {
  constructor(
    public readonly interactionHistory: InteractionHistory,
    public readonly modelName: string,
    public readonly temperature: number
  ) {}

  async *complete(): Completion {
    const { messages } = this.interactionHistory.buildState();

    const chatAI = buildChatOpenAI({
      modelName: this.modelName,
      temperature: this.temperature,
      streaming: true,
    });

    this.interactionHistory.addEvent(new CompletionEvent(this.modelName, this.temperature));

    const response = await chatAI.completionWithRetry({
      messages,
      model: this.modelName,
      stream: true,
    });

    for await (const token of response) {
      const content = token.choices.map((choice) => choice.delta.content).join('');
      yield content;
    }
  }
}
