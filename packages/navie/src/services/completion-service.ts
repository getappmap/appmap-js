import type { BaseLanguageModelInterface, TokenUsage } from '@langchain/core/language_models/base';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import Message from '../message';

export enum ModelType {
  Full, // slower, more intelligent
  Mini, // faster, less intelligent
}

export type JsonOptions = {
  model?: ModelType;
  temperature?: number;
  maxRetries?: number;
};

export default interface CompletionService {
  complete: (messages: readonly Message[], options?: { temperature?: number }) => Completion;
  json<Schema extends z.ZodType>(
    messages: Message[],
    schema: Schema,
    options?: JsonOptions
  ): Promise<z.infer<Schema> | undefined>;
  readonly modelName: string;
  readonly miniModelName: string;
  readonly temperature?: number;
  readonly model?: BaseLanguageModelInterface;
}

export class Usage implements Required<TokenUsage> {
  constructor(public pricesPerMTokens?: { input: number; output: number }) {}
  completionTokens = 0;
  promptTokens = 0;

  get totalTokens() {
    return this.completionTokens + this.promptTokens;
  }

  get cost() {
    if (this.pricesPerMTokens) {
      return (
        (this.promptTokens * this.pricesPerMTokens.input +
          this.completionTokens * this.pricesPerMTokens.output) /
        1_000_000
      );
    }
    return undefined;
  }

  toString(): string {
    let result = `Tokens (prompt/compl/total): ${this.promptTokens}/${this.completionTokens}/${this.totalTokens}`;
    const { cost } = this;
    if (cost) result += `, cost: $${cost.toFixed(2)}`;
    return result;
  }
}

export type Completion = AsyncGenerator<string, Usage, void>;

// Some LLMs only accept a single system message.
// This functions merges all system messages into a single message
// at the start of the list.
export function mergeSystemMessages(messages: readonly Message[]): Message[] {
  const systemMessages = messages.filter((message) => message.role === 'system');
  const nonSystemMessages = messages.filter((message) => message.role !== 'system');
  const mergedSystemMessage = {
    role: 'system',
    content: systemMessages.map((message) => message.content).join('\n'),
  } as const;
  return [mergedSystemMessage, ...nonSystemMessages];
}

const MESSAGE_CONSTRUCTORS = {
  assistant: AIMessage,
  system: SystemMessage,
  user: HumanMessage,
  tool: SystemMessage,
  function: SystemMessage,
};

export function convertToMessage(message: Message): BaseMessage {
  const Cons = MESSAGE_CONSTRUCTORS[message.role];
  let content = '';
  if (Array.isArray(message.content)) {
    content = message.content.join('\n');
  } else if (typeof message.content === 'string') {
    content = message.content;
  }
  return new Cons({ content });
}
