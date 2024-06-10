import { ChatOpenAI } from '@langchain/openai';
import { warn } from 'console';
import OpenAI from 'openai';

import Message from '../message';
import completion from './completion';

export default class Oracle {
  constructor(
    public name: string,
    private systemPrompt: string,
    private modelName: string,
    private temperature: number
  ) {}

  async ask(messages: Message[], question?: string): Promise<string | undefined> {
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

    let response = '';
    for await (const token of completion(openAI, collectMessages())) {
      response += token;
    }

    warn(`${this.name} response:\n${response}`);

    return response;
  }
}
