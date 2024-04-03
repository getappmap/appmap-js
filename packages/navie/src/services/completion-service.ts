import { ChatOpenAI } from '@langchain/openai';

import InteractionHistory, { CompletionEvent } from '../interaction-history';
import type Message from '../message';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

export type Completion = AsyncIterable<string>;

export default interface CompletionService {
  complete: () => Completion;
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

  async *complete(): Completion {
    const { messages } = this.interactionHistory.buildState();

    const contextDir = join(homedir(), '.appmap', 'context');
    await mkdir(contextDir, { recursive: true });
    await writeFile(
      join(contextDir, `${new Date().valueOf()}.json`),
      JSON.stringify(messages, null, 2)
    );

    const chatAI = new ChatOpenAI({
      modelName: this.modelName,
      temperature: this.temperature,
      streaming: true,
    });

    this.interactionHistory.addEvent(new CompletionEvent(this.modelName, this.temperature));

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
