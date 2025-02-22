import { warn } from 'node:console';
import { isNativeError } from 'node:util/types';

import { ChatAnthropic } from '@langchain/anthropic';
import { z } from 'zod';

import Message from '../message';
import CompletionService, {
  Completion,
  CompletionRetries,
  CompletionRetryDelay,
  convertToMessage,
  CompleteOptions,
  mergeSystemMessages,
  Usage,
} from './completion-service';
import Trajectory from '../lib/trajectory';

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

type ClaudeError = {
  type: 'error';
  status?: number;
  error: {
    type: string;
    message: string;
  };
};

// Parses Claude's error format from an error message
function getClaudeError(e: unknown): ClaudeError | undefined {
  if (e instanceof Error && 'status' in e) {
    // API errors contain an error object
    if ('error' in e) {
      return {
        ...(e.error as ClaudeError),
        status: e.status as number | undefined,
      };
    }

    // SSE errors contain the stringified error object in the message
    try {
      const error = JSON.parse(e.message) as ClaudeError;
      error.status = e.status as number | undefined;
      return error;
    } catch {
      // ignore
    }
  }
  return undefined;
}

export default class AnthropicCompletionService extends CompletionService {
  constructor(modelName: string, temperature: number, trajectory: Trajectory) {
    super(modelName, temperature, trajectory);
    this.model = this.buildModel({ temperature });
    this.maxTokens = 200_000;
    this.countMessageTokens = this.model.getNumTokens.bind(this.model);
  }
  model: ChatAnthropic;

  // Construct a model with non-default options. There doesn't seem to be a way to configure
  // the model parameters at invocation time like with OpenAI.
  private buildModel(options?: {
    model?: string;
    temperature?: number;
    streaming?: boolean;
  }): ChatAnthropic {
    return new ChatAnthropic({
      modelName: options?.model ?? this.modelName,
      temperature: options?.temperature ?? this.temperature,
      streaming: options?.streaming ?? true,
    });
  }

  get miniModelName(): string {
    const miniModel = process.env.APPMAP_NAVIE_MINI_MODEL;
    return miniModel ?? this.modelName;
  }

  // Request a JSON object with a given JSON schema.
  async json<Schema extends z.ZodType>(
    messages: Message[],
    schema: Schema,
    options?: CompleteOptions
  ): Promise<z.infer<Schema> | undefined> {
    const maxRetries = options?.maxRetries ?? 3;
    const model = this.buildModel({ ...options, streaming: false });
    const sentMessages = mergeSystemMessages(messages);

    for (const message of sentMessages) this.trajectory.logSentMessage(message);

    let response: z.infer<Schema>;
    try {
      response = await model
        .withStructuredOutput<Schema>(schema)
        .withRetry({ stopAfterAttempt: maxRetries })
        .invoke(sentMessages.map(convertToMessage));
    } catch (err) {
      warn(`Failed to generate JSON after ${maxRetries} attempts: ${String(err)}`);
      return undefined;
    }

    this.trajectory.logReceivedMessage({
      role: 'assistant',
      content: JSON.stringify(response),
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response;
  }

  async *_complete(messages: readonly Message[], options?: { temperature?: number }): Completion {
    const usage = new Usage(COST_PER_M_TOKEN[this.modelName]);
    const model = this.buildModel(options);
    const sentMessages: Message[] = mergeSystemMessages(messages);
    const tokens = new Array<string>();
    for (const message of sentMessages) this.trajectory.logSentMessage(message);

    const maxAttempts = CompletionRetries;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const response = await model.stream(sentMessages.map(convertToMessage));

        // eslint-disable-next-line @typescript-eslint/naming-convention, no-await-in-loop
        for await (const { content, usage_metadata } of response) {
          yield content.toString();
          tokens.push(content.toString());
          if (usage_metadata) {
            usage.promptTokens += usage_metadata.input_tokens;
            usage.completionTokens += usage_metadata.output_tokens;
          }
        }

        this.trajectory.logReceivedMessage({
          role: 'assistant',
          content: tokens.join(''),
        });

        break;
      } catch (cause) {
        if (attempt < maxAttempts - 1 && tokens.length === 0) {
          const apiError = getClaudeError(cause);
          if (apiError) {
            const nextAttempt = CompletionRetryDelay * 2 ** attempt;
            const shouldRetry = apiError.status === undefined;

            if (
              apiError.status === 400 &&
              apiError.error.type === 'invalid_request_error' &&
              apiError.error.message.includes('prompt is too long')
            ) {
              const { message } = apiError.error;
              // messages are like "prompt is too long: 200009 tokens > 200000 maximum"
              const promptTokens = parseInt(message.match(/(\d+) tokens/)?.[1] ?? '0', 10);
              const maxTokens = parseInt(message.match(/(\d+) maximum/)?.[1] ?? '0', 10);

              throw await this.promptTooLong(messages, cause, promptTokens, maxTokens);
            }

            if (shouldRetry) {
              warn(`Received ${JSON.stringify(apiError.error)}, retrying in ${nextAttempt}ms`);

              // eslint-disable-next-line no-await-in-loop
              await new Promise<void>((resolve) => {
                setTimeout(resolve, nextAttempt);
              });

              // eslint-disable-next-line no-continue
              continue;
            }
          }
        }
        throw new Error(
          `Failed to complete after ${attempt + 1} attempt(s): ${errorMessage(cause)}`,
          {
            cause,
          }
        );
      }
    }

    warn(usage.toString());
    return usage;
  }
}

function errorMessage(err: unknown): string {
  if (isNativeError(err)) return err.cause ? errorMessage(err.cause) : err.message;
  return String(err);
}
