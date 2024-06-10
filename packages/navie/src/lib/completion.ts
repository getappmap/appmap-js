import { warn } from 'node:console';

import type { TokenUsage } from '@langchain/core/language_models/base';
import { AIMessage, HumanMessage, SystemMessage, type BaseMessage } from '@langchain/core/messages';
import type { ChatOpenAI } from '@langchain/openai';
import type { ChatCompletionMessageParam } from 'openai/resources';

const MESSAGE_CONSTRUCTORS = {
  assistant: AIMessage,
  system: SystemMessage,
  user: HumanMessage,
  tool: SystemMessage,
  function: SystemMessage,
};

function convertToMessage(message: ChatCompletionMessageParam): BaseMessage {
  const Cons = MESSAGE_CONSTRUCTORS[message.role];
  return new Cons({ content: message.content ?? '' });
}

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

interface Usage extends Required<TokenUsage> {
  cost?: number;
}

function resultToString(this: Usage): string {
  let result = `Tokens (prompt/compl/total): ${this.promptTokens}/${this.completionTokens}/${this.totalTokens}`;
  if (this.cost) result += `, cost: $${this.cost.toFixed(2)}`;
  return result;
}

function tokenUsage(promptTokens: number, completionTokens: number, modelName: string): Usage {
  const result: Usage = {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
  };

  const prices = COST_PER_M_TOKEN[modelName];
  if (prices)
    result.cost = (prices.input * promptTokens + prices.output * completionTokens) / 1_000_000;

  result.toString = resultToString;
  return result;
}

function estimateTokens(messages: ChatCompletionMessageParam[]): number {
  return messages.map((x) => x.content?.toString().length ?? 0).reduce((x, y) => x + y);
}

async function countTokens(openAI: ChatOpenAI, messages: ChatCompletionMessageParam[]) {
  try {
    const count = await openAI.getNumTokensFromMessages(messages.map(convertToMessage));
    return count?.totalCount ?? estimateTokens(messages);
  } catch (e) {
    return estimateTokens(messages);
  }
}

export default async function* completion(
  openAI: ChatOpenAI,
  messages: ChatCompletionMessageParam[]
): AsyncGenerator<string, Usage, unknown> {
  const promptTokensPromise = countTokens(openAI, messages);
  const response = await openAI.completionWithRetry({
    messages,
    model: openAI.modelName,
    stream: true,
  });

  let tokenCount = 0;
  for await (const token of response) {
    const { content } = token.choices[0].delta;
    if (content) yield content;
    tokenCount += 1;
  }
  const usage = tokenUsage(await promptTokensPromise, tokenCount, openAI.modelName);
  warn(usage.toString());
  return usage;
}
