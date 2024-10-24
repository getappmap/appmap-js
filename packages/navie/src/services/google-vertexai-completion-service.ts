import { warn } from 'node:console';
import { isNativeError } from 'node:util/types';

import { ChatVertexAI, type ChatVertexAIInput } from '@langchain/google-vertexai-web';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

import Trajectory from '../lib/trajectory';
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

export default class GoogleVertexAICompletionService implements CompletionService {
  constructor(
    public readonly modelName: string,
    public readonly temperature: number,
    private trajectory: Trajectory
  ) {}

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
  async json<Schema extends z.ZodType>(
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

    for (const message of sentMessages) this.trajectory.logSentMessage(message);

    const response = await model.invoke(sentMessages.map(convertToMessage));

    this.trajectory.logReceivedMessage({
      role: 'assistant',
      content: JSON.stringify(response),
    });

    const sanitizedContent = response.content.toString().replace(/^`{3,}[^\s]*?$/gm, '');
    const parsed = JSON.parse(sanitizedContent) as unknown;
    schema.parse(parsed);
    return parsed;
  }

  async *complete(messages: readonly Message[], options?: { temperature?: number }): Completion {
    const usage = new Usage();
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
          const nextAttempt = CompletionRetryDelay * 2 ** attempt;
          warn(`Received ${JSON.stringify(cause)}, retrying in ${nextAttempt}ms`);
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
