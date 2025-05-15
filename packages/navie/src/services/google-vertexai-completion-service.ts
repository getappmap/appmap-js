import assert from 'node:assert';
import { warn } from 'node:console';
import { isNativeError } from 'node:util/types';

import { ChatVertexAI, type ChatVertexAIInput } from '@langchain/google-vertexai-web';
import { zodResponseFormat } from 'openai/helpers/zod';
import pRetry from 'p-retry';
import { z } from 'zod';

import Message from '../message';
import CompletionService, {
  CompleteOptions,
  Completion,
  CompletionRetries,
  CompletionRetryDelay,
  convertToMessage,
  mergeSystemMessages,
  Usage,
} from './completion-service';

export default class GoogleVertexAICompletionService extends CompletionService {
  // Construct a model with non-default options. There doesn't seem to be a way to configure
  // the model parameters at invocation time like with OpenAI.
  private buildModel(options?: ChatVertexAIInput): ChatVertexAI {
    return new ChatVertexAI({
      model: this.modelName,
      temperature: this.temperature,
      streaming: true,
      maxOutputTokens: 8192,
      ...options,
    });
  }

  get miniModelName(): string {
    const miniModel = process.env.APPMAP_NAVIE_MINI_MODEL;
    return miniModel ?? 'gemini-1.5-flash-002';
  }

  // Request a JSON object with a given JSON schema.
  async _json<Schema extends z.ZodType>(
    messages: Message[],
    schema: Schema,
    options?: CompleteOptions
  ): Promise<z.infer<Schema> | undefined> {
    const model = this.buildModel({
      ...options,
      streaming: false,
      responseMimeType: 'application/json',
    });
    const sentMessages = mergeSystemMessages([
      ...messages,
      {
        role: 'system',
        content: `Use the following JSON schema for your response:\n\n${JSON.stringify(
          zodResponseFormat(schema, 'requestedObject').json_schema.schema,
          null,
          2
        )}`,
      },
    ]);

    let { temperature } = model;

    const processResponse = async () => {
      for (const message of sentMessages) this.trajectory.logSentMessage(message);

      const response = await model.invoke(sentMessages.map(convertToMessage), { temperature });

      this.trajectory.logReceivedMessage({
        role: 'assistant',
        content: JSON.stringify(response),
      });

      const sanitizedContent = response.content.toString().replace(/^`{3,}[^\s]*?$/gm, '');
      try {
        const parsed = JSON.parse(sanitizedContent) as unknown;
        schema.parse(parsed);
        return parsed;
      } catch (e) {
        assert(isNativeError(e));
        (e as Error & { response: unknown })['response'] = response;
        throw e;
      }
    };

    return await pRetry(processResponse, {
      retries: CompletionRetries,
      minTimeout: CompletionRetryDelay,
      randomize: true,
      onFailedAttempt: (err) => {
        warn(`Failed to complete after ${err.attemptNumber} attempt(s): ${String(err)}`);
        if ('response' in err) warn(`Response: ${JSON.stringify(err.response)}`);
        temperature += 0.1;
      },
    });
  }

  async *_complete(messages: readonly Message[], options?: { temperature?: number }): Completion {
    const usage = new Usage();
    const model = this.buildModel(options);
    let { temperature } = model;
    const sentMessages: Message[] = mergeSystemMessages(messages);
    const tokens = new Array<string>();
    for (const message of sentMessages) this.trajectory.logSentMessage(message);

    const maxAttempts = CompletionRetries;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const response = await model.stream(sentMessages.map(convertToMessage), { temperature });

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
        temperature += 0.1;
        if (attempt < maxAttempts - 1 && tokens.length === 0) {
          const nextAttempt = CompletionRetryDelay * 2 ** attempt;
          warn(`Received ${JSON.stringify(cause).slice(0, 400)}, retrying in ${nextAttempt}ms`);
          await new Promise<void>((resolve) => {
            setTimeout(resolve, nextAttempt);
          });
          continue;
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
