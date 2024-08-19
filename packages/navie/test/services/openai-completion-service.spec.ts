import * as OpenAI from '@langchain/openai';

import InteractionHistory from '../../src/interaction-history';
import OpenAICompletionService from '../../src/services/openai-completion-service';
import { z } from 'zod';
import Message from '../../src/message';
import { ModelType } from '../../src/services/completion-service';

jest.mock('@langchain/openai');

describe('OpenAICompletionService', () => {
  let interactionHistory: InteractionHistory;
  let service: OpenAICompletionService;
  const modelName = 'the-model-name';
  const temperature = 0.2;

  beforeEach(() => {
    interactionHistory = new InteractionHistory();
    service = new OpenAICompletionService(modelName, temperature);
  });

  describe('when the completion service is created', () => {
    it('has the correct model name', () => {
      expect(service.modelName).toEqual(modelName);
    });
    it('has the correct temperature', () => {
      expect(service.temperature).toEqual(temperature);
    });
  });

  describe('when the completion service is used', () => {
    const openAI = jest.mocked(OpenAI.ChatOpenAI);
    const completionWithRetry = jest.mocked<
      (
        request: OpenAI.OpenAIClient.Chat.ChatCompletionCreateParamsStreaming,
        options?: OpenAI.OpenAICoreRequestOptions
      ) => Promise<AsyncIterable<OpenAI.OpenAIClient.Chat.Completions.ChatCompletionChunk>>
    >(OpenAI.ChatOpenAI.prototype.completionWithRetry);

    beforeEach(() => {
      const generator =
        async function* (): AsyncIterable<OpenAI.OpenAIClient.Chat.Completions.ChatCompletionChunk> {
          yield {
            choices: [
              {
                delta: {
                  content: 'User management works by managing users.',
                  role: 'assistant',
                },
                finish_reason: 'stop',
                index: 0,
                logprobs: null,
              },
            ],
            id: 'the-id',
            model: 'the-model',
            created: 1234567890,
            object: 'chat.completion.chunk',
          };
        };

      completionWithRetry.mockImplementation(async () => generator());
    });

    const complete = async (options: { temperature: number | undefined }) => {
      const { messages } = interactionHistory.buildState();
      const tokens = service.complete(messages, options);
      const result = new Array<string>();
      for await (const token of tokens) {
        result.push(token);
      }
      return result;
    };

    it('completes the question', async () => {
      const tokens = await complete({ temperature: undefined });
      expect(tokens).toEqual(['User management works by managing users.']);

      expect(openAI).toHaveBeenCalled();
      expect(openAI).toHaveBeenCalledWith({
        modelName: modelName,
        temperature: temperature,
        streaming: true,
      });
      expect(completionWithRetry).toHaveBeenCalledTimes(1);
    });

    describe('with a custom temperature', () => {
      it('completes the question', async () => {
        await complete({ temperature: 0.5 });
        expect(completionWithRetry).toHaveBeenCalledWith(
          expect.objectContaining({ temperature: 0.5 })
        );
      });
    });
  });

  describe('json', () => {
    it('returns the parsed JSON', async () => {
      service.model.completionWithRetry = jest.fn().mockResolvedValue({
        choices: [{ message: { content: '{"answer": "42"}' } }],
      });

      const schema = z.object({ answer: z.string() });
      const result = await service.json([], schema);
      expect(result).toEqual({ answer: '42' });
    });

    it('returns undefined if the JSON does not validate', async () => {
      service.model.completionWithRetry = jest.fn().mockResolvedValue({
        choices: [{ message: { content: '{"answer": 42}' } }],
      });

      const schema = z.object({ answer: z.string() });
      const result = await service.json([], schema);
      expect(result).toBeUndefined();
    });

    it('returns undefined if the JSON is not parsable', async () => {
      service.model.completionWithRetry = jest.fn().mockResolvedValue({
        choices: [{ message: { content: 'not JSON' } }],
      });

      const schema = z.object({ answer: z.string() });
      const result = await service.json([], schema);
      expect(result).toBeUndefined();
    });

    it('propagates arguments as expected', async () => {
      const messages: Message[] = [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'the question' },
      ];
      const schema = z.object({ answer: z.string() });
      const options = { temperature: 1.0, model: ModelType.Mini };
      await service.json(messages, schema, options);
      expect(service.model.completionWithRetry).toHaveBeenCalledWith(
        expect.objectContaining({
          messages,
          temperature: options.temperature,
          model: service.miniModelName,
        })
      );
    });

    it('retries the expected number of times on failure', async () => {
      service.model.completionWithRetry = jest.fn().mockResolvedValue({ choices: [] });
      const schema = z.object({ answer: z.string() });
      const maxRetries = 5;
      await service.json([], schema, { maxRetries });
      expect(service.model.completionWithRetry).toHaveBeenCalledTimes(maxRetries);
    });

    describe('when running locally', () => {
      const originalBaseURL = process.env.OPENAI_BASE_URL;

      beforeEach(() => {
        process.env.OPENAI_BASE_URL = 'http://localhost:8080';
      });

      afterEach(() => {
        if (originalBaseURL) {
          process.env.OPENAI_BASE_URL = originalBaseURL;
        } else {
          delete process.env.OPENAI_BASE_URL;
        }
      });

      it('provides the JSON schema in the system prompt', async () => {
        service.model.completionWithRetry = jest.fn().mockResolvedValue({
          choices: [{ message: { content: '{"answer": "42"}' } }],
        });

        const schema = z.object({ answer: z.string() });
        await service.json([], schema);
        expect(service.model.completionWithRetry).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: [
              {
                role: 'system',
                content: expect.stringContaining(
                  JSON.stringify(
                    {
                      type: 'object',
                      properties: {
                        answer: {
                          type: 'string',
                        },
                      },
                      required: ['answer'],
                      additionalProperties: false,
                      $schema: 'http://json-schema.org/draft-07/schema#',
                    },
                    null,
                    2
                  )
                ),
              },
            ],
          })
        );
      });

      it('handles Visual Studio Code Copilot responses', async () => {
        service.model.completionWithRetry = jest.fn().mockResolvedValue({
          choices: [
            {
              // Copilot will return a chunk even when streaming is disabled.
              delta: { content: '{"answer": "42"}' },
            },
          ],
        });

        const schema = z.object({ answer: z.string() });
        const result = await service.json([], schema);
        expect(result).toEqual({ answer: '42' });
      });
    });
  });

  describe('resolveModel', () => {
    interface ResolveModelTest {
      resolveModel: (modelType?: ModelType) => string;
    }

    let resolveModel: ResolveModelTest['resolveModel'];
    beforeEach(() => {
      resolveModel = (modelType?: ModelType) =>
        (service as unknown as ResolveModelTest).resolveModel(modelType);
    });

    it('returns the full model name by default', () => {
      expect(resolveModel(ModelType.Full)).toEqual(modelName);
    });

    it('returns the mini model name', () => {
      expect(resolveModel(ModelType.Mini)).toEqual(service.miniModelName);
    });

    describe('when running locally', () => {
      const originalVars = {
        OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
        APPMAP_NAVIE_MINI_MODEL: process.env.APPMAP_NAVIE_MINI_MODEL,
      };

      beforeEach(() => {
        process.env.OPENAI_BASE_URL = 'http://localhost:8080';
      });

      afterEach(() => {
        Object.entries(originalVars).forEach(([key, value]) => {
          if (value) {
            process.env[key] = value;
          } else {
            delete process.env[key];
          }
        });
      });

      it('returns the full model name as the mini model name by default', () => {
        expect(resolveModel(ModelType.Mini)).toEqual(modelName);
      });

      it('overrides the mini model name with the environment variable', () => {
        const miniModelName = 'the-mini-model-name';
        process.env.APPMAP_NAVIE_MINI_MODEL = miniModelName;
        expect(resolveModel(ModelType.Mini)).toEqual(miniModelName);
      });
    });
  });
});
