import { ChatOpenAI } from '@langchain/openai';
import { warn } from 'console';
import Message, { CHARACTERS_PER_TOKEN } from '../message';
import CompletionService, {
  Completion,
  convertToMessage,
  mergeSystemMessages,
  Usage,
} from './completion-service';

/*
  Generated on https://openai.com/api/pricing/ with
  Object.fromEntries(
    $$('.w-full')
      .filter(
        ({ children: [c] }) => [...(c?.classList ?? [])]?.includes('grid') && c.children.length === 3
      )
      .map(({ children: [, ...items] }) => items)
      .flat()
      .map(({ children: [...c] }) => c.map((x) => x.innerText))
      .map(([model, input, output]) => [
        model,
        { input: parseFloat(input.replace(',', '.')), output: parseFloat(input.replace(',', '.')) },
      ])
  );
*/
const COST_PER_M_TOKEN: Record<string, { input: number; output: number }> = {
  'gpt-4o': {
    input: 5,
    output: 5,
  },
  'gpt-4o-2024-05-13': {
    input: 5,
    output: 5,
  },
  'gpt-4o-mini': {
    input: 0.15,
    output: 0.6,
  },
  'gpt-3.5-turbo-0125': {
    input: 0.5,
    output: 0.5,
  },
  'gpt-3.5-turbo-instruct': {
    input: 1.5,
    output: 1.5,
  },
  'gpt-4-turbo': {
    input: 10,
    output: 10,
  },
  'gpt-4-turbo-2024-04-09': {
    input: 10,
    output: 10,
  },
  'gpt-4': {
    input: 30,
    output: 30,
  },
  'gpt-4-32k': {
    input: 60,
    output: 60,
  },
  'gpt-4-0125-preview': {
    input: 10,
    output: 10,
  },
  'gpt-4-1106-preview': {
    input: 10,
    output: 10,
  },
  'gpt-4-vision-preview': {
    input: 10,
    output: 10,
  },
  'gpt-3.5-turbo-1106': {
    input: 1,
    output: 1,
  },
  'gpt-3.5-turbo-0613': {
    input: 1.5,
    output: 1.5,
  },
  'gpt-3.5-turbo-16k-0613': {
    input: 3,
    output: 3,
  },
  'gpt-3.5-turbo-0301': {
    input: 1.5,
    output: 1.5,
  },
  'davinci-002': {
    input: 2,
    output: 2,
  },
  'babbage-002': {
    input: 0.4,
    output: 0.4,
  },
};

function tokenUsage(promptTokens: number, completionTokens: number, modelName: string): Usage {
  const result = new Usage(COST_PER_M_TOKEN[modelName]);
  result.promptTokens = promptTokens;
  result.completionTokens = completionTokens;
  return result;
}

function estimateTokens(messages: readonly Message[]): number {
  const nonEmpty = messages.map((x) => x.content?.toString().length ?? 0);
  if (nonEmpty.length) return nonEmpty.reduce((x, y) => x + y) / CHARACTERS_PER_TOKEN;
  return 0;
}

export default class OpenAICompletionService implements CompletionService {
  constructor(public readonly modelName: string, public readonly temperature: number) {
    this.model = new ChatOpenAI({
      modelName: this.modelName,
      temperature: this.temperature,
      streaming: true,
    });
  }
  model: ChatOpenAI;

  async *complete(messages: readonly Message[], options?: { temperature?: number }): Completion {
    const promptTokensPromise = this.countTokens(messages);
    const response = await this.model.completionWithRetry({
      messages: mergeSystemMessages(messages),
      model: this.model.modelName,
      stream: true,
      temperature: options?.temperature,
    });

    let tokenCount = 0;
    for await (const token of response) {
      const { content } = token.choices[0].delta;
      if (content) yield content;
      tokenCount += 1;
    }
    const usage = tokenUsage(await promptTokensPromise, tokenCount, this.modelName);
    warn(usage.toString());
    return usage;
  }

  async countTokens(messages: readonly Message[]): Promise<number> {
    try {
      const count = await this.model.getNumTokensFromMessages(messages.map(convertToMessage));
      return count?.totalCount ?? estimateTokens(messages);
    } catch (e) {
      return estimateTokens(messages);
    }
  }
}
