import * as OpenAI from '@langchain/openai';

import InteractionHistory, { PromptInteractionEvent } from '../../src/interaction-history';
import Trajectory, { TrajectoryEvent } from '../../src/lib/trajectory';
import OpenAICompletionService from '../../src/services/openai-completion-service';
import { z } from 'zod';
import Message from '../../src/message';
import { PromptType } from '../../src/prompt';
import { APIError } from 'openai';
import MessageTokenReducerService from '../../src/services/message-token-reducer-service';

jest.mock('@langchain/openai');

describe('OpenAICompletionService', () => {
  let interactionHistory: InteractionHistory;
  let messageTokenReducerService: MessageTokenReducerService;
  let service: OpenAICompletionService;
  let trajectory: Trajectory;
  const modelName = 'the-model-name';
  const temperature = 0.2;

  beforeEach(() => {
    interactionHistory = new InteractionHistory();
    messageTokenReducerService = new MessageTokenReducerService();
    trajectory = new Trajectory();
    service = new OpenAICompletionService(
      modelName,
      temperature,
      trajectory,
      messageTokenReducerService
    );
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
      interactionHistory.addEvent(
        new PromptInteractionEvent(PromptType.Question, 'user', 'What is user management?')
      );

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
      expect(openAI).toHaveBeenCalledWith(
        expect.objectContaining({
          modelName,
          temperature,
          streaming: true,
        })
      );
      expect(completionWithRetry).toHaveBeenCalledTimes(1);
    });

    it('emits trajectory events', async () => {
      const events = new Array<TrajectoryEvent>();
      trajectory.on('event', (event) => events.push(event));

      await complete({ temperature: undefined });

      expect(events.map((e) => e.message.role)).toEqual(['system', 'user', 'assistant']);
      expect(events.map((e) => e.type)).toEqual(['sent', 'sent', 'received']);
    });

    it('retries on server error with exponential backoff during response iteration', async () => {
      let callCount = 0;
      // eslint-disable-next-line @typescript-eslint/require-await
      const mockCompletionWithRetry = jest.fn().mockImplementation(async function* () {
        if (callCount === 0) {
          callCount += 1;
          throw new APIError(
            undefined,
            {
              message:
                'The server had an error processing your request. Sorry about that! You can retry your request, or contact us through our help center at help.openai.com if you keep seeing this error.',
              type: 'server_error',
              param: null,
              code: null,
            },
            undefined,
            undefined
          );
        }

        // This is the success case after retry
        yield {
          choices: [{ delta: { content: 'Hello' } }],
        };
      });

      service.model.completionWithRetry = mockCompletionWithRetry;

      const messages = [{ role: 'user', content: 'Hello' }] as const;
      const result = [];
      for await (const token of service.complete(messages)) {
        result.push(token);
      }

      expect(result).toEqual(['Hello']);
      expect(mockCompletionWithRetry).toHaveBeenCalledTimes(2);
    });

    it('retries if token count exceeds limit', async () => {
      let callCount = 0;
      // eslint-disable-next-line @typescript-eslint/require-await
      const mockCompletionWithRetry = jest.fn().mockImplementation(async function* () {
        if (callCount === 0) {
          callCount += 1;
          throw new APIError(
            undefined,
            {
              message:
                "This model's maximum context length is 128000 tokens. However, your messages resulted in 128001 tokens. Please reduce the length of the messages.",
              type: 'invalid_request_error',
              param: 'messages',
              code: 'context_length_exceeded',
            },
            undefined,
            undefined
          );
        }

        // This is the success case after retry
        yield {
          choices: [{ delta: { content: 'Hello' } }],
        };
      });
      const reduceMessageTokens = jest
        .spyOn(messageTokenReducerService, 'reduceMessageTokens')
        .mockResolvedValue([]);

      service.model.completionWithRetry = mockCompletionWithRetry;

      const messages = [{ role: 'user', content: 'Hello' }] as const;
      const result = [];
      for await (const token of service.complete(messages)) {
        result.push(token);
      }

      expect(result).toEqual(['Hello']);
      expect(mockCompletionWithRetry).toHaveBeenCalledTimes(2);
      expect(reduceMessageTokens).toHaveBeenCalledTimes(1);
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
      const options = { temperature: 1.0, model: service.miniModelName };
      await service.json(messages, schema, options);
      expect(service.model.completionWithRetry).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            { role: 'system', content: expect.stringContaining(messages[0].content) },
            ...messages.slice(1),
          ],
          temperature: options.temperature,
          model: service.miniModelName,
        })
      );
    });

    it('logs sent messages to the trajectory', async () => {
      const trajectoryEvents = new Array<TrajectoryEvent>();
      trajectory.on('event', (event) => trajectoryEvents.push(event));

      service.model.completionWithRetry = jest.fn().mockResolvedValue({
        choices: [{ message: { content: '{"answer": "42"}' } }],
      });

      const messages: Message[] = [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'the question' },
      ];
      await service.json(messages, z.object({ answer: z.string() }));
      expect(trajectoryEvents.map((e) => e.message.role)).toEqual(['system', 'user', 'assistant']);
      expect(trajectoryEvents.map((e) => e.type)).toEqual(['sent', 'sent', 'received']);
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

      it('emits trajectory events', async () => {
        const trajectoryEvents = new Array<TrajectoryEvent>();
        trajectory.on('event', (event) => trajectoryEvents.push(event));

        service.model.completionWithRetry = jest.fn().mockResolvedValue({
          choices: [{ message: { content: '{"answer": "42"}' } }],
        });

        const schema = z.object({ answer: z.string() });
        await service.json(
          [
            {
              role: 'user',
              content: 'the question',
            },
          ],
          schema
        );
        expect(trajectoryEvents.map((e) => e.message.role)).toEqual([
          'system',
          'user',
          'assistant',
        ]);
        expect(trajectoryEvents.map((e) => e.type)).toEqual(['sent', 'sent', 'received']);
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

  describe('model names', () => {
    it('returns the full model name by default', () => {
      expect(service.modelName).toEqual(modelName);
    });

    it('returns the mini model name', () => {
      //.When using the official OpenAI endpoint, the mini model name
      // will default to `gpt-4o-mini`.
      expect(service.miniModelName).toEqual('gpt-4o-mini');
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
        expect(service.miniModelName).toEqual(modelName);
      });

      it('overrides the mini model name with the environment variable', () => {
        const miniModelName = 'the-mini-model-name';
        process.env.APPMAP_NAVIE_MINI_MODEL = miniModelName;
        expect(service.miniModelName).toEqual(miniModelName);
      });
    });
  });
});
