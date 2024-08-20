import { warn } from 'node:console';
import { isNativeError } from 'node:util/types';

import { ChatAnthropic } from '@langchain/anthropic';

import Message from '../message';
import CompletionService, {
  Completion,
  convertToMessage,
  mergeSystemMessages,
  Usage,
} from './completion-service';

/* 
  Generated on https://docs.anthropic.com/en/docs/about-claude/models with
  Object.fromEntries(
    $$('table tbody')
      .filter((x) => x.children.length === 11)
      .map(
        ({
          children: {
            4: {
              children: [, ...names],
            },
            9: {
              children: [, ...prices],
            },
          },
        }) =>
          [...names.entries()].map(([i, name]) => [
            name.innerText,
            ...prices[i].innerText.split(' / ').map((p) => parseFloat(p.slice(1))),
          ])
      )
      .flat()
      .map(([name, input, output]) => [name, { input, output }])
  );
*/
const COST_PER_M_TOKEN: Record<string, { input: number; output: number }> = {
  'claude-3-5-sonnet-20240620': {
    input: 3,
    output: 15,
  },
  'claude-3-opus-20240229': {
    input: 15,
    output: 75,
  },
  'claude-3-sonnet-20240229': {
    input: 3,
    output: 15,
  },
  'claude-3-haiku-20240307': {
    input: 0.25,
    output: 1.25,
  },
  'claude-2.1': {
    input: 8,
    output: 24,
  },
  'claude-2.0': {
    input: 8,
    output: 24,
  },
  'claude-instant-1.2': {
    input: 0.8,
    output: 2.4,
  },
};

export default class AnthropicCompletionService implements CompletionService {
  constructor(public readonly modelName: string, public readonly temperature: number) {
    this.model = new ChatAnthropic({
      modelName: this.modelName,
      temperature: this.temperature,
      streaming: true,
    });
  }
  model: ChatAnthropic;

  async *complete(messages: readonly Message[]): Completion {
    try {
      const response = await this.model.stream(mergeSystemMessages(messages).map(convertToMessage));

      const usage = new Usage(COST_PER_M_TOKEN[this.modelName]);

      // eslint-disable-next-line @typescript-eslint/naming-convention
      for await (const { content, usage_metadata } of response) {
        yield content.toString();
        if (usage_metadata) {
          usage.promptTokens += usage_metadata.input_tokens;
          usage.completionTokens += usage_metadata.output_tokens;
        }
      }

      warn(usage.toString());
      return usage;
    } catch (e) {
      // throw a new error so we have stack from here instead of deep within the callback jungle
      throw new Error(`Failed to complete: ${isNativeError(e) ? e.message : String(e)}`);
    }
  }
}