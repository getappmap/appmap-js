import { warn } from 'console';

import Message from '../message';
import CompletionService from '../services/completion-service';

export default class Oracle {
  constructor(
    public name: string,
    private systemPrompt: string,
    private completionService: CompletionService
  ) {}

  async ask(messages: Message[], question?: string): Promise<string | undefined> {
    const collectMessages = (): Message[] => {
      const result: Message[] = [
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
    for await (const token of this.completionService.complete(collectMessages())) {
      response += token;
    }

    warn(`${this.name} response:\n${response}`);

    return response;
  }
}
