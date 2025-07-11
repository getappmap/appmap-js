import assert from 'node:assert';

import type { BaseLanguageModelInterface, TokenUsage } from '@langchain/core/language_models/base';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import Message, { CHARACTERS_PER_TOKEN } from '../message';
import type Trajectory from '../lib/trajectory';
import { isNativeError } from 'util/types';

type ContextOverflowResult = 'throw' | 'truncate';
type ContextOverflowCallback = (
  promptTokens: number,
  maxTokens: number
) => ContextOverflowResult | undefined | void;
type ContextOverflowAction = ContextOverflowResult | ContextOverflowCallback;

export type CompleteOptions = {
  model?: string;
  temperature?: number;
  maxRetries?: number;
  onContextOverflow?: ContextOverflowAction;
};

export type CompletionServiceOptions = {
  modelName: string;
  temperature: number;
  trajectory: Trajectory;
};

export class PromptTooLongError extends Error {
  constructor(
    public cause: unknown,
    public promptTokens: number,
    public maxTokens: number
  ) {
    const message = isNativeError(cause) ? cause.message : String(cause);
    super(message);
  }

  readonly name = 'PromptTooLongError';
}

export class PaymentRequiredError extends Error {
  constructor(options?: ErrorOptions) {
    super(
      'This service requires additional payment to use. Please check your subscription or billing status.',
      options
    );
  }

  readonly name = 'PaymentRequiredError';
}

export default abstract class CompletionService {
  constructor(
    public modelName: string,
    public temperature: number,
    public trajectory: Trajectory
  ) {}

  protected abstract _complete(
    messages: readonly Message[],
    options?: CompleteOptions
  ): AsyncGenerator<string, Usage | undefined | void, void>;

  /**
   * Generates a completion based on the provided messages.
   *
   * @param messages - The conversation messages to generate a completion for
   * @param options - Optional configuration options for the completion
   * @yields - Chunks of the completion as they are generated
   * @returns - The final completion result
   * @throws {PromptTooLongError} - When the prompt exceeds token limits
   *
   * @generator
   * @async
   */
  async *complete(messages: readonly Message[], options?: CompleteOptions): Completion {
    const shouldTruncate = makeTruncationDeterminer(options?.onContextOverflow);
    let conversation = await this.checkLength(messages, shouldTruncate);
    let started = false;
    let usage: Usage | undefined;

    while (!started) {
      try {
        const completion = this._complete(conversation, options);
        let result;
        while (!(result = await completion.next()).done) {
          started = true;
          yield result.value;
        }
        usage = result.value || undefined;
      } catch (e) {
        if (e instanceof PromptTooLongError) {
          if (!started && shouldTruncate(e.promptTokens, this.maxTokens)) {
            const truncated = truncateMessages(conversation, e.promptTokens, this.maxTokens);
            if (truncated) {
              conversation = truncated;
              continue;
            }
          }
        }
        throw e;
      }
    }
    return usage ?? new Usage();
  }

  private async checkLength(
    messages: readonly Message[],
    shouldTruncate: (promptTokens: number, maxTokens: number) => boolean
  ) {
    // Only count tokens if the conversation is likely to be too long
    // This is a heuristic to avoid counting tokens for every message
    // and to avoid unnecessary API calls
    if (totalConversationCharacters(messages) > this.maxTokens) {
      const promptTokens = await this.countTokens(messages);
      if (promptTokens > this.maxTokens) {
        if (shouldTruncate(promptTokens, this.maxTokens)) {
          const truncated = truncateMessages(messages, promptTokens, this.maxTokens);
          if (truncated) return truncated;
        }
        throw await this.promptTooLong(messages, 'Prompt too long', promptTokens, this.maxTokens);
      }
    }
    return messages;
  }

  protected abstract _json<Schema extends z.ZodType>(
    messages: readonly Message[],
    schema: Schema,
    options?: CompleteOptions
  ): Promise<z.infer<Schema> | undefined>;
  async json<Schema extends z.ZodType>(
    messages: readonly Message[],
    schema: Schema,
    options?: CompleteOptions
  ): Promise<z.infer<Schema> | undefined> {
    const shouldTruncate = makeTruncationDeterminer(options?.onContextOverflow);
    const conversation = await this.checkLength(messages, shouldTruncate);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return await this._json(conversation, schema, options);
    } catch (error) {
      if (error instanceof PromptTooLongError) {
        if (shouldTruncate(error.promptTokens, this.maxTokens)) {
          const truncated = truncateMessages(conversation, error.promptTokens, this.maxTokens);
          if (truncated) return this.json(truncated, schema, options);
        }
        throw error;
      } else if (error instanceof PaymentRequiredError) {
        throw error;
      }
    }
  }
  abstract readonly miniModelName: string;
  readonly model?: BaseLanguageModelInterface;
  maxTokens: number = Infinity;

  /**
   * Counts the number of tokens in a message.
   * Subclasses can override this method to provide a custom token counting implementation.
   * By default, it uses a simple estimation based on the length of the message.
   * This is a rough estimate and may not be accurate for all models.
   * @param message - The message to count tokens for
   * @returns
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async countMessageTokens(message: string): Promise<number> {
    return estimateTokens(message);
  }

  async countTokens(messages: readonly Message[]): Promise<number> {
    const tokens = await Promise.all(
      messages.map((message) =>
        this.countMessageTokens(message.content).catch((error) => {
          console.warn(`Failed to count tokens: ${error}`);
          return estimateTokens(message.content);
        })
      )
    );
    return tokens.reduce((acc, token) => acc + token + 1, 0); // +1 for each message to account for the role
  }

  /**
   * Creates a PromptTooLongError with the specified parameters.
   * This method is used to create a custom error when the prompt exceeds the token limit.
   * It calculates the prompt tokens and max tokens based on the provided messages and options, if not provided.
   * It also updates the maxTokens property of the class instance.
   * @param messages - The conversation messages
   * @param cause - The cause of the error
   * @param promptTokens - The number of tokens in the prompt
   * @param maxTokens - The maximum number of tokens allowed
   * @returns - A Promise that resolves to a PromptTooLongError
   */
  async promptTooLong(
    messages: readonly Message[],
    cause: unknown,
    promptTokens?: number,
    maxTokens?: number
  ): Promise<PromptTooLongError> {
    const promptTokensCount = promptTokens || (await this.countTokens(messages));
    const maxTokensCount = Math.min(maxTokens || Infinity, this.maxTokens, promptTokensCount - 1);
    if (maxTokensCount > 0) this.maxTokens = maxTokensCount;
    return new PromptTooLongError(cause, promptTokensCount, maxTokensCount);
  }
}

function makeTruncationDeterminer(
  action?: ContextOverflowAction
): (promptTokens: number, maxTokens: number) => boolean {
  if (typeof action === 'function')
    return function (prompt, max) {
      return action(prompt, max) !== 'throw';
    };
  if (action === 'throw') return () => false;
  return () => true;
}

function estimateTokens(message: string): number {
  // Estimate the number of tokens in a message based on its length
  // This is a rough estimate and may not be accurate for all models
  return Math.ceil(message.length / CHARACTERS_PER_TOKEN);
}

function totalConversationCharacters(messages: readonly Message[]): number {
  return messages.reduce((acc, message) => acc + message.content.length, 0);
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
export function mergeSystemMessages(
  messages: readonly Message[]
): [Message & { role: 'system' }, ...Message[]] {
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

// Number of retries to attempt a completion before giving up
export const CompletionRetries = (() => {
  const env = process.env.APPMAP_NAVIE_COMPLETION_RETRIES;
  if (env) {
    const value = parseInt(env, 10);
    if (Number.isInteger(value) && value > 0) {
      return value;
    }
  }

  return 5;
})();

// Base delay between retries in milliseconds, before exponential backoff
export const CompletionRetryDelay = (() => {
  const env = process.env.APPMAP_NAVIE_COMPLETION_RETRY_DELAY;
  if (env) {
    const value = parseInt(env, 10);
    if (Number.isInteger(value) && value > 0) {
      return value;
    }
  }

  return 1000;
})();

/**
 * Truncates messages to fit within the specified token limit, by truncating the content of the longest message.
 * If not possible to fit within the limit, returns undefined.
 * @param messages
 * @param promptTokens
 * @param maxTokens
 * @returns Truncated messages or undefined if truncation is not possible
 * @throws {Error} If promptTokens is not greater than maxTokens
 */
export function truncateMessages(
  messages: readonly Message[],
  promptTokens: number,
  maxTokens: number
): Message[] | undefined {
  console.warn(`Prompt too long: ${promptTokens} tokens, max: ${maxTokens} tokens. Truncating...`);
  assert(promptTokens > maxTokens, 'promptTokens must be greater than maxTokens');
  /*
   * Here's the idea: we want to shorten the conversation by truncating the longest message,
   * but we don't want to call token counting because it might be slow and expensive.
   * So instead, we look at char length of the messages as a proxy. We select the longest
   * message (preferably user) and truncate it by however many characters needed to bring
   * the total estimated conversation length under max.
   *
   * So, given P prompt tokens, L prompt characters and M max tokens (P>M),
   * we need to shave off P-M tokens, which comes down to (P-M)/P * L total characters,
   * plus a couple percent overhead.
   *
   * We bail if it can't be done (ie. we'd have to remove the longest message and it would still be too long.)
   */
  const totalChars = messages.reduce((acc, message) => acc + message.content.length, 0);

  const charsToRemove =
    1.05 * // 5% overhead
      Math.ceil(((promptTokens - maxTokens) / promptTokens) * totalChars) +
    1; // Defensively add 1 to ensure it's not zero
  assert(charsToRemove > 0, 'No need to truncate messages');

  const longestMessageIndex = pickMessageToTruncate(messages);
  const longestMessage = messages[longestMessageIndex];
  // Leave at least 10 characters in the message
  if (longestMessage.content.length <= charsToRemove + 10) return undefined;

  const newMessages = [...messages];
  newMessages[longestMessageIndex] = {
    ...longestMessage,
    content: longestMessage.content.slice(0, -charsToRemove),
  };
  return newMessages;
}

function pickMessageToTruncate(messages: readonly Message[]): number {
  assert(messages.length > 0, 'No messages to truncate');
  // Find the longest message that can be truncated
  const truncatableMessages = messages
    .map((msg, index) => ({
      index,
      length: msg.content.length,
      role: msg.role,
    }))
    // Prefer truncating user messages over system/assistant
    .sort((a, b) => b.length - a.length || (a.role === 'user' ? -1 : 1));

  return truncatableMessages[0].index;
}
