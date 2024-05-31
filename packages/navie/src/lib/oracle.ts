import { ChatOpenAI } from '@langchain/openai';
import { warn } from 'console';
import OpenAI from 'openai';

import Message from '../message';
import parseJSON from './parse-json';

export default class Oracle {
  constructor(
    public name: string,
    private systemPrompt: string,
    private modelName: string,
    private temperature: number
  ) {}

  async ask<T>(messages: Message[], question?: string): Promise<T | undefined> {
    const openAI: ChatOpenAI = new ChatOpenAI({
      modelName: this.modelName,
      temperature: this.temperature,
    });

    const collectMessages = (): OpenAI.ChatCompletionMessageParam[] => {
      const result: OpenAI.ChatCompletionMessageParam[] = [
        {
          content: this.systemPrompt,
          role: 'system',
        },
        ...messages,
      ];
      if (question) {
        result.push({
          content: question,
          role: 'user',
        });
      }
      return result;
    };

    const response = await openAI.completionWithRetry({
      messages: collectMessages(),
      model: openAI.modelName,
      stream: true,
    });
    const tokens = Array<string>();
    for await (const token of response) {
      tokens.push(token.choices.map((choice) => choice.delta.content).join(''));
    }
    const rawResponse = tokens.join('');
    warn(`${this.name} response:\n${rawResponse}`);

    return parseJSON<T>(rawResponse);
  }
}
