import { debug as makeDebug } from 'node:util';
import { isNativeError } from 'node:util/types';

import { getModelNameForTiktoken } from '@langchain/core/language_models/base';
import { ChatOpenAI } from '@langchain/openai';
import type { ChatCompletion, ChatCompletionChunk } from 'openai/resources/index';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { warn } from 'console';
import CompletionService, {
  Completion,
  CompletionRetries,
  CompletionRetryDelay,
  CompleteOptions,
  mergeSystemMessages,
  Usage,
  CompletionServiceOptions,
} from './completion-service';
import Trajectory from '../lib/trajectory';
import Message, { CHARACTERS_PER_TOKEN } from '../message';
import { APIError } from 'openai';
import { findObject, tryParseJson } from '../lib/parse-json';
import trimFences from '../lib/trim-fences';
import { performance } from 'node:perf_hooks';

// For some reason this doesn't work as import
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getEncodingNameForModel } = require('js-tiktoken/lite') as {
  getEncodingNameForModel: (x: string) => string;
};

const debug = makeDebug('appmap:navie:openai-completion-service');

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
    output: 15,
  },
  'gpt-4o-2024-08-06': {
    input: 2.5,
    output: 10,
  },
  'gpt-4o-2024-05-13': {
    input: 5,
    output: 15,
  },
  'gpt-4o-mini': {
    input: 0.15,
    output: 0.6,
  },
  'gpt-4o-mini-2024-07-18': {
    input: 0.15,
    output: 0.6,
  },
  'o1-preview': {
    input: 15,
    output: 60,
  },
  'o1-preview-2024-09-12': {
    input: 15,
    output: 60,
  },
  'o1-mini': {
    input: 3,
    output: 12,
  },
  'o1-mini-2024-09-12': {
    input: 3,
    output: 12,
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

const STATUS_NO_RETRY = [
  400, // Bad Request
  401, // Unauthorized
  402, // Payment Required
  403, // Forbidden
  404, // Not Found
  405, // Method Not Allowed
  406, // Not Acceptable
  407, // Proxy Authentication Required
  409, // Conflict
  422, // Unprocessable Entity
];

// based on https://github.com/langchain-ai/langchainjs/blob/5d63f397c02f232d2a3729ed34461e209cfb0350/langchain-core/src/utils/async_caller.ts#L17
function onFailedAttempt(error: unknown) {
  console.warn(error);
  if (isNativeError(error)) {
    if (error.message.startsWith('Cancel') || error.message.startsWith('AbortError')) throw error;
    if (error.name === 'AbortError') throw error;
    if ('code' in error && error.code === 'ECONNABORTED') throw error;
    const response =
      ('response' in error && typeof error.response === 'object' && error.response) || error;
    if ('status' in response && STATUS_NO_RETRY.includes(Number(response.status))) throw error;
    if (
      'error' in error &&
      typeof error.error === 'object' &&
      error.error &&
      'code' in error.error &&
      error.error.code === 'insufficient_quota'
    ) {
      const err = new Error(error.message);
      err.name = 'InsufficientQuotaError';
      throw err;
    }
  }
}

const countCodeFences = (text: string): number =>
  Array.from(text.matchAll(/^\s*?`{3,}\w*?$/gm)).length;

export type OpenAICompletionServiceOptions = CompletionServiceOptions & {
  apiKey?: string;
  apiUrl?: string;
};

export default class OpenAICompletionService extends CompletionService {
  constructor(
    modelName: string,
    temperature: number,
    trajectory: Trajectory,
    private apiUrl?: string,
    private apiKey?: string
  ) {
    super(modelName, temperature, trajectory);
    this.model = new ChatOpenAI({
      modelName: this.modelName,
      temperature: this.temperature,
      streaming: true,
      onFailedAttempt,
      // If the `apiKey` or `apiUrl` are `undefined`, LangChain will fall back to use the default
      // environment variables for OpenAI.
      configuration: { baseURL: this.apiUrl },
      apiKey: this.apiKey,
    });
    try {
      getEncodingNameForModel(getModelNameForTiktoken(modelName));
    } catch {
      warn(`Unknown model ${modelName}, using estimated token count`);
      this.model.getNumTokens = (c) =>
        Promise.resolve(typeof c === 'string' ? c.length / CHARACTERS_PER_TOKEN : 0);
    }
    this.countMessageTokens = this.model.getNumTokens.bind(this.model);
    this.maxTokens = contextWindowSize(modelName);
  }
  model: ChatOpenAI;

  get miniModelName(): string {
    const miniModel = process.env.APPMAP_NAVIE_MINI_MODEL;
    if (miniModel) return miniModel;

    // If the mini model is not specified, fall back to `APPMAP_NAVIE_MODEL` when running locally.
    return this.isLocalModel ? this.modelName : 'gpt-4o-mini';
  }

  // eslint-disable-next-line class-methods-use-this
  private get isLocalModel(): boolean {
    const baseUrl =
      this.apiUrl ?? process.env.OPENAI_BASE_URL ?? process.env.AZURE_OPENAI_BASE_PATH;
    if (!baseUrl) return false;

    try {
      // Check to see if the base URL points to an official OpenAI API endpoint.
      const { hostname } = new URL(baseUrl);
      return hostname.match(/openai.(?:azure.)?com$/i) === null;
    } catch {
      return true;
    }
  }

  // Request a JSON object with a given JSON schema.
  async json<Schema extends z.ZodType>(
    messages: readonly Message[],
    schema: Schema,
    options?: CompleteOptions
  ): Promise<z.infer<Schema> | undefined> {
    const jsonSchema = zodResponseFormat(schema, 'requestedObject').json_schema.schema;
    if (!jsonSchema)
      throw new Error(`Unable to generate JSON schema for ${schema.constructor.name}`);

    // If using a local model, provide the JSON schema to the model in the system prompt.
    // This method is more likely to generate failure cases, but will be retried.
    const generateLocal = () => {
      const sentMessages = mergeSystemMessages([...messages, schemaPrompt(jsonSchema)]);
      for (const message of sentMessages) this.trajectory.logSentMessage(message);

      debug('Sending messages to local model:', sentMessages);

      return this.model.completionWithRetry({
        messages: sentMessages,
        model: options?.model ?? this.modelName,
        stream: false,
        temperature: options?.temperature,
      });
    };
    // If using the OpenAI API, use the structured output response format.
    // This method unlikely to generate failure cases.
    const generateOpenAi = () => {
      const schemaSupported = !isSchemaUnsupported(jsonSchema);
      const sentMessages = mergeSystemMessages(messages);
      if (!schemaSupported) sentMessages.push(schemaPrompt(jsonSchema));
      for (const message of sentMessages) this.trajectory.logSentMessage(message);

      return this.model.completionWithRetry({
        messages: sentMessages,
        model: options?.model ?? this.miniModelName,
        stream: false,
        temperature: options?.temperature,
        response_format: schemaSupported
          ? zodResponseFormat(schema, 'requestedObject')
          : { type: jsonSchema.type === 'object' ? 'json_object' : 'text' },
      });
    };

    const maxRetries = options?.maxRetries ?? 3;
    for (let i = 0; i < maxRetries; i += 1) {
      const generateJson = this.isLocalModel ? generateLocal : generateOpenAi;
      warn(`Requesting JSON completion`);
      const startTime = performance.now();
      const response = await generateJson(); // eslint-disable-line no-await-in-loop
      const endTime = performance.now();
      warn(`Received JSON response in ${(endTime.valueOf() - startTime.valueOf()) / 1000}s`);
      if (!response?.choices?.length) {
        warn(`Bad response, retrying (${i + 1}/${maxRetries})`);
        continue; // eslint-disable-line no-continue
      }

      // As of 1.92, the Copilot endpoint in Visual Studio Code always returns chunks even when
      // streaming has been disabled.
      const [choice] = response.choices as (ChatCompletion.Choice | ChatCompletionChunk.Choice)[];
      let completion: { content?: string | null };
      if ('message' in choice) {
        completion = choice.message;
      } else if ('delta' in choice) {
        completion = choice.delta;
      } else {
        warn(`Unexpected response choice: ${JSON.stringify(choice)}`);
        continue; // eslint-disable-line no-continue
      }

      // Copilot tends to respond with this when hitting content filters.
      if (completion.content === "Sorry, I can't assist with that.") {
        warn('LLM refused to respond, probably hit a content filter.');
        return;
      }

      if (completion && completion.content !== null && completion.content !== undefined) {
        this.trajectory.logReceivedMessage({ role: 'assistant', content: completion.content });
        debug('Received JSON response:', completion.content);

        try {
          const parsed = tryParseJson(completion.content, trimFences, findObject);
          schema.parse(parsed);
          return parsed;
        } catch {
          // fall through
        }
      }

      warn(`Failed to parse JSON, retrying (${i + 1}/${maxRetries})`);
    }

    return undefined;
  }

  async *_complete(messages: readonly Message[], options?: CompleteOptions): Completion {
    const tokens = new Array<string>();
    const model = options?.model ?? this.model.modelName;
    const isO1 = this.modelName.startsWith('o1-');
    const usage = new Usage(COST_PER_M_TOKEN[model]);
    const sentMessages: Message[] = mergeSystemMessages(messages);

    if (isO1) {
      // O1 does not support system messages, so prepend the system message to the newest user message.
      const { content } = sentMessages.shift()!;
      const userIdx = sentMessages.findLastIndex(({ role }) => role === 'user');
      if (userIdx === -1) sentMessages.push({ content, role: 'user' });
      else sentMessages[userIdx].content = content + '\n\n' + sentMessages[userIdx].content;
    }

    for (const message of sentMessages) this.trajectory.logSentMessage(message);

    const fetchResponse = async () => {
      return isO1
        ? // o1 currently doesn't support streaming or temperatures != 1
          this.model.completionWithRetry({
            messages: sentMessages,
            model,
            stream: false,
            temperature: 1,
          })
        : this.model.completionWithRetry({
            messages: sentMessages,
            model,
            stream: true,
            temperature: options?.temperature,
            stream_options: { include_usage: true },
          });
    };

    for (let attempt = 0; attempt < CompletionRetries; attempt++) {
      try {
        warn(`Requesting completion`);
        const startTime = performance.now();
        const response = await fetchResponse();
        const endTime = performance.now();
        warn(
          `Received completion response in ${(endTime.valueOf() - startTime.valueOf()) / 1000}s`
        );
        if ('choices' in response) {
          const { content } = response.choices[0].message;
          if (content) {
            yield content;
            tokens.push(content);
          }
          if (response.usage) {
            usage.promptTokens = response.usage.prompt_tokens;
            usage.completionTokens = response.usage.completion_tokens;
          }
        } else {
          for await (const token of response) {
            if (token.choices.length > 0) {
              const choice = token.choices[0];
              const { finish_reason: finishReason } = choice;
              if (finishReason === 'content_filter') {
                // The LLM provider has immediately terminated the response. This happens, for
                // instance, when Copilot matches public code.
                //
                // All we can do is notify the user what happened. This is irreparable due to the
                // fact that we've already yielded some tokens.
                //
                // To present the message cleanly, we'll first detect whether the message is
                // currently writing out code within code fences. If so, we'll first close the open
                // fence.
                const numCodeFences = countCodeFences(tokens.join(''));
                if (numCodeFences % 2 > 0) {
                  // Note that this doesn't properly balance code fences of varying lengths, but
                  // at the time of writing this, our prompts don't encourage that and I've not
                  // observed it in the wild. -DB
                  yield '\n```\n';
                }

                yield '---\n';
                yield 'Sorry, the LLM provider has terminated the response due to content filtering restrictions.\n';
                break;
              }
              const { content } = choice.delta;
              if (content) {
                tokens.push(content);
                yield content;
              }
            }
            if (token.usage) {
              usage.promptTokens += token.usage.prompt_tokens;
              usage.completionTokens += token.usage.completion_tokens;
            }
          }
        }
        break; // Exit loop if successful
      } catch (error) {
        if (!(error instanceof APIError)) throw error; // only retry on server errors
        if (tokens.length || attempt === CompletionRetries - 1) throw error; // Rethrow if tokens were yielded or max attempts reached
        if (error.type === 'invalid_request_error' && error.code === 'context_length_exceeded') {
          const message = error.message;
          // messages are like "This model's maximum context length is 16385 tokens. However, your messages resulted in 40007 tokens"
          const promptLength = parseInt(message.match(/in (\d+) tokens/)?.[1] ?? '0', 10);
          const maxTokens = parseInt(
            message.match(/maximum context length is (\d+)/)?.[1] ?? '0',
            10
          );
          throw await this.promptTooLong(messages, error, promptLength, maxTokens);
        } else if (error.type !== 'server_error') throw error; // only retry on server errors
        await new Promise(
          (resolve) => setTimeout(resolve, CompletionRetryDelay * Math.pow(2, attempt)) // Exponential backoff
        );
      }
    }

    this.trajectory.logReceivedMessage({ role: 'assistant', content: tokens.join('') });

    warn(usage.toString());
    return usage;
  }
}

/**
 * Returns true if the schema is not supported by the OpenAI API.
 * See https://platform.openai.com/docs/guides/structured-outputs#supported-schemas
 * for details. Note currently this is a partial implementation; additional checks
 * should be added as needed.
 */
function isSchemaUnsupported(schema: Record<string, unknown>): boolean {
  return schema.type !== 'object' || !!schema.additionalProperties;
}

function schemaPrompt(jsonSchema: Record<string, unknown>): Message {
  return {
    role: 'system',
    content: `Use the following JSON schema for your response:\n\n${JSON.stringify(
      jsonSchema,
      null,
      2
    )}`,
  };
}

function contextWindowSize(modelName: string): number {
  if (modelName.startsWith('gpt-4')) return 128_000;
  if (modelName.startsWith('gpt-4.1')) return 1_048_576;
  if (modelName.startsWith('gpt-3.5')) return 16_384;
  if (modelName.startsWith('o')) return 128_000;
  return Infinity;
}