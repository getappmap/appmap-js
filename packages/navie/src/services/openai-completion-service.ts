import { isNativeError } from 'node:util/types';

import { ChatOpenAI } from '@langchain/openai';
import type { ChatCompletion, ChatCompletionChunk } from 'openai/resources/index';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { warn } from 'console';
import Message, { CHARACTERS_PER_TOKEN } from '../message';
import CompletionService, {
  Completion,
  convertToMessage,
  JsonOptions,
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

export default class OpenAICompletionService implements CompletionService {
  constructor(public readonly modelName: string, public readonly temperature: number) {
    this.model = new ChatOpenAI({
      modelName: this.modelName,
      temperature: this.temperature,
      streaming: true,
      onFailedAttempt,
    });
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
    const baseUrl = process.env.OPENAI_BASE_URL ?? process.env.AZURE_OPENAI_BASE_PATH;
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
    messages: Message[],
    schema: Schema,
    options?: JsonOptions
  ): Promise<z.infer<Schema> | undefined> {
    // If using a local model, provide the JSON schema to the model in the system prompt.
    // This method is more likely to generate failure cases, but will be retried.
    const generateLocal = () =>
      this.model.completionWithRetry({
        messages: mergeSystemMessages([
          ...messages,
          {
            role: 'system',
            content: `Use the following JSON schema for your response:\n\n${JSON.stringify(
              zodResponseFormat(schema, 'requestedObject').json_schema.schema,
              null,
              2
            )}`,
          },
        ]),
        model: options?.model ?? this.modelName,
        stream: false,
        temperature: options?.temperature,
      });

    // If using the OpenAI API, use the structured output response format.
    // This method unlikely to generate failure cases.
    const generateOpenAi = () =>
      this.model.completionWithRetry({
        messages: mergeSystemMessages(messages),
        model: options?.model ?? this.miniModelName,
        stream: false,
        temperature: options?.temperature,
        response_format: zodResponseFormat(schema, 'requestedObject'),
      });

    const maxRetries = options?.maxRetries ?? 3;
    for (let i = 0; i < maxRetries; i += 1) {
      const generateJson = this.isLocalModel ? generateLocal : generateOpenAi;
      const response = await generateJson(); // eslint-disable-line no-await-in-loop
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

      if (completion.content) {
        try {
          // Strip code fences
          const sanitizedContent = completion.content.replace(/^`{3,}[^\s]*?$/gm, '');
          const parsed = JSON.parse(sanitizedContent) as unknown;
          schema.parse(parsed);
          return parsed;
        } catch (e) {
          // fall through
        }
      }

      warn(`Failed to parse JSON, retrying (${i + 1}/${maxRetries})`);
    }

    return undefined;
  }

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
