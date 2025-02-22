import * as OpenAI from '@langchain/openai';

import InteractionHistory, { PromptInteractionEvent } from '../../src/interaction-history';
import Trajectory, { TrajectoryEvent } from '../../src/lib/trajectory';
import OpenAICompletionService from '../../src/services/openai-completion-service';
import { z } from 'zod';
import Message from '../../src/message';
import { PromptType } from '../../src/prompt';
import { APIError } from 'openai';
import { PromptTooLongError } from '../../src/services/completion-service';

jest.mock('@langchain/openai');

describe('OpenAICompletionService', () => {
  let interactionHistory: InteractionHistory;
  let service: OpenAICompletionService;
  let trajectory: Trajectory;
  const modelName = 'the-model-name';
  const temperature = 0.2;

  beforeEach(() => {
    interactionHistory = new InteractionHistory();
    trajectory = new Trajectory();
    service = new OpenAICompletionService(modelName, temperature, trajectory);
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
    beforeEach(() => {
      interactionHistory.addEvent(
        new PromptInteractionEvent(PromptType.Question, 'user', 'What is user management?')
      );
      mockCompletion('User management works by managing users.');
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
      // eslint-disable-next-line @typescript-eslint/require-await
      responseMock.mockImplementationOnce(() => {
        throw new APIError(
          undefined,
          {
            message:
              'The server had an error processing your request. Sorry about that! You can retry your request, or contact us through our help center at help.openai.com if you keep seeing this error.',
            type: 'server_error',
          },
          undefined,
          undefined
        );
      });
      mockCompletion('Hello');

      const messages = [{ role: 'user', content: 'Hello' }] as const;
      const result = [];
      for await (const token of service.complete(messages)) {
        result.push(token);
      }

      expect(result).toEqual(['Hello']);
      expect(completionWithRetry).toHaveBeenCalledTimes(2);
    });

    it('throws if token count exceeds limit and onContextOverflow is set to throw', async () => {
      responseMock.mockImplementationOnce(() => {
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
      });

      const messages = [{ role: 'user', content: 'Hello' }] as const;

      await expect(
        service.complete(messages, { onContextOverflow: 'throw' }).next()
      ).rejects.toThrow(PromptTooLongError);
      expect(completionWithRetry).toHaveBeenCalledTimes(1);
      expect(service.maxTokens).toEqual(128000);
    });

    it('truncates messages by default when token count exceeds limit', async () => {
      const messages = [
        { role: 'system', content: 'Short system message' },
        { role: 'user', content: 'A'.repeat(1000) },
        { role: 'assistant', content: 'Short response' },
      ] as const;

      responseMock
        .mockImplementationOnce(() => {
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
        })
        .mockImplementation(() => 'Completion after truncation');

      const result = [];
      for await (const token of service.complete(messages)) {
        result.push(token);
      }

      expect(result).toEqual(['Completion after truncation']);
      expect(completionWithRetry).toHaveBeenCalledTimes(2);
      expect(service.maxTokens).toEqual(128000);
    });

    it('gives up if truncation is impossible', async () => {
      const messages = [
        { role: 'system', content: 'A'.repeat(100) },
        { role: 'user', content: 'B'.repeat(100) },
        { role: 'assistant', content: 'C'.repeat(100) },
      ] as const;

      responseMock.mockImplementation(() => {
        throw new APIError(
          undefined,
          {
            message:
              "This model's maximum context length is 1000 tokens. However, your messages resulted in 128001 tokens. Please reduce the length of the messages.",
            type: 'invalid_request_error',
            param: 'messages',
            code: 'context_length_exceeded',
          },
          undefined,
          undefined
        );
      });

      await expect(service.complete(messages).next()).rejects.toThrow(PromptTooLongError);
      expect(completionWithRetry).toHaveBeenCalledTimes(1);
      expect(service.maxTokens).toEqual(1000);
    });

    describe('content restriction', () => {
      it('notifies the user if a content restriction is encountered', async () => {
        completionWithRetry.mockResolvedValue([
          { choices: [{ finish_reason: 'content_filter' }] },
        ] as never);

        const result = [];
        for await (const token of service.complete([])) {
          result.push(token);
        }

        expect(result).toEqual([
          '---\n',
          expect.stringContaining('Sorry, the LLM provider has terminated the response'),
        ]);
      });

      it('closes an open code block if a content restriction is encountered', async () => {
        completionWithRetry.mockResolvedValue([
          { choices: [{ delta: { content: '```java\n' } }] },
          { choices: [{ finish_reason: 'content_filter' }] },
        ] as never);

        const result = [];
        for await (const token of service.complete([])) {
          result.push(token);
        }

        expect(result).toEqual([
          '```java\n',
          '\n```\n',
          '---\n',
          expect.stringContaining('Sorry, the LLM provider has terminated the response'),
        ]);
      });
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
      mockCompletion('{"answer": "42"}');

      const schema = z.object({ answer: z.string() });
      const result = await service.json([], schema);
      expect(result).toEqual({ answer: '42' });
    });

    it('returns undefined if the JSON does not validate', async () => {
      mockCompletion('{"answer": 42}');

      const schema = z.object({ answer: z.string() });
      const result = await service.json([], schema);
      expect(result).toBeUndefined();
    });

    it('returns undefined if the JSON is not parsable', async () => {
      mockCompletion('not JSON');

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
      expect(completionWithRetry).toHaveBeenCalledWith(
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

      mockCompletion('{"answer": "42"}');

      const messages: Message[] = [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'the question' },
      ];
      await service.json(messages, z.object({ answer: z.string() }));
      expect(trajectoryEvents.map((e) => e.message.role)).toEqual(['system', 'user', 'assistant']);
      expect(trajectoryEvents.map((e) => e.type)).toEqual(['sent', 'sent', 'received']);
    });

    it('retries the expected number of times on failure', async () => {
      completionWithRetry.mockResolvedValue({ choices: [] } as never);
      const schema = z.object({ answer: z.string() });
      const maxRetries = 5;
      await service.json([], schema, { maxRetries });
      expect(completionWithRetry).toHaveBeenCalledTimes(maxRetries);
    });

    it('should handle content filter response', async () => {
      const messages = [{ role: 'user', content: 'Hello' }] as const;
      const schema = z.object({ key: z.string() });

      mockCompletion("Sorry, I can't assist with that.");

      const result = await service.json(messages, schema);
      expect(result).toBeUndefined();
      expect(completionWithRetry).toHaveBeenCalledTimes(1);
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
        mockCompletion('{"answer": "42"}');

        const schema = z.object({ answer: z.string() });
        await service.json([], schema);
        expect(completionWithRetry).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: [
              {
                role: 'system',
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

        mockCompletion('{"answer": "42"}');

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
        completionWithRetry.mockResolvedValue(chunk('{"answer": "42"}') as never);

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

  const openAI = jest.mocked(OpenAI.ChatOpenAI);

  const responseMock = jest.fn<string, []>();
  function mockCompletion(response: string) {
    responseMock.mockReturnValue(response);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async function completionResp(request: OpenAI.OpenAIClient.Chat.ChatCompletionCreateParams) {
    if (request.stream)
      // eslint-disable-next-line @typescript-eslint/require-await
      return (async function* () {
        yield chunk(responseMock());
      })();
    else return completion(responseMock());
  }

  const completionWithRetry = jest.spyOn(OpenAI.ChatOpenAI.prototype, 'completionWithRetry');
  beforeEach(() => completionWithRetry.mockImplementation(completionResp as never));
  afterEach(jest.resetAllMocks);
});

function chunk(response: string): OpenAI.OpenAIClient.Chat.Completions.ChatCompletionChunk {
  return {
    choices: [
      {
        delta: {
          content: response,
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
}

function completion(response: string): OpenAI.OpenAIClient.Chat.Completions.ChatCompletion {
  return {
    id: 'the-id',
    model: 'the-model',
    created: 1234567890,
    object: 'chat.completion',
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    choices: [
      {
        message: { content: response, refusal: null, role: 'assistant' },
        finish_reason: 'stop',
        index: 0,
        logprobs: null,
      },
    ],
  };
}
