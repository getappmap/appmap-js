import AnthropicCompletionService from '../../src/services/anthropic-completion-service';

import { ChatAnthropic } from '@langchain/anthropic';
import { IterableReadableStream } from '@langchain/core/utils/stream';
import { AIMessageChunk } from '@langchain/core/messages';
import { z } from 'zod';
import { RunnableBinding } from '@langchain/core/runnables';
import Trajectory, { TrajectoryEvent } from '../../src/lib/trajectory';
import MessageTokenReducerService from '../../src/services/message-token-reducer-service';

describe('AnthropicCompletionService', () => {
  let messageTokenReducerService: MessageTokenReducerService;
  let trajectory: Trajectory;
  let service: AnthropicCompletionService;
  const modelName = 'anthropic-model';
  const temperature = 0.3;

  const originalEnv = process.env;

  beforeEach(() => {
    process.env['ANTHROPIC_API_KEY'] = 'test-api-key';
    messageTokenReducerService = new MessageTokenReducerService();
    trajectory = new Trajectory();
    service = new AnthropicCompletionService(
      modelName,
      temperature,
      trajectory,
      messageTokenReducerService
    );
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('has the correct model name', () => {
    expect(service.modelName).toEqual(modelName);
  });

  it('has the correct temperature', () => {
    expect(service.temperature).toEqual(temperature);
  });

  describe('completing a question', () => {
    const messages = [
      { role: 'user', content: 'What is your name?' },
      { role: 'assistant', content: 'I am a bot.' },
    ] as const;

    beforeEach(() => {
      jest.clearAllMocks();
      mockAnthropicStream('Anthropic completion result');
    });

    const complete = async () => {
      const completion = service.complete(messages);
      const result: string[] = [];
      for await (const token of completion) {
        result.push(token);
      }
      return result;
    };

    it('completes the question', async () => {
      const result = await complete();
      expect(result).toEqual(['Anthropic completion result']);
    });

    it('emits trajectory events', async () => {
      const events = new Array<TrajectoryEvent>();
      trajectory.on('event', (event) => events.push(event));

      await complete();

      // I am not sure why we are sending it an "assistant" message, but here it is.
      expect(events.map((e) => e.message.role)).toEqual([
        'system',
        'user',
        'assistant',
        'assistant',
      ]);
      expect(events.map((e) => e.type)).toEqual(['sent', 'sent', 'sent', 'received']);
    });

    it('retries on overloaded error', async () => {
      jest.useFakeTimers();
      const stream = jest.spyOn(ChatAnthropic.prototype, 'stream').mockImplementation(() => {
        function gen(): AsyncGenerator<AIMessageChunk> {
          const sseError = {
            type: 'error',
            error: {
              type: 'overloaded_error',
              message: 'Overloaded',
            },
          };
          const error = Object.defineProperties(new Error(JSON.stringify(sseError)), {
            status: {
              value: undefined,
            },
          });
          throw error;
        }
        return Promise.resolve(IterableReadableStream.fromAsyncGenerator(gen()));
      });

      const completion = service.complete([]).next();

      const delays = [1000, 2000, 4000, 8000];

      for (const delay of delays) {
        jest.advanceTimersByTime(delay);

        // Yield to the event loop to allow another attempt to be made
        // eslint-disable-next-line no-await-in-loop
        await Promise.resolve();
      }

      await expect(completion).rejects.toThrow('Failed to complete');
      expect(stream).toHaveBeenCalledTimes(5);
    });

    it('truncates messages if context length exceeded', async () => {
      const stream = jest.spyOn(ChatAnthropic.prototype, 'stream').mockImplementation(() => {
        const message = 'prompt is too long: 200000 tokens > 199999 maximum';
        const error = Object.defineProperties(new Error(message), {
          status: {
            value: 400,
          },
          error: {
            value: {
              type: 'error',
              error: {
                type: 'invalid_request_error',
                message,
              },
            },
          },
        });
        throw error;
      });
      const reduceMessageTokens = jest
        .spyOn(messageTokenReducerService, 'reduceMessageTokens')
        .mockResolvedValue([]);
      const completion = service.complete([]);
      const consumePromise = (async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        try {
          for await (const chunk of completion) {
            // We don't expect to get any chunks
          }
        } catch (e) {
          /* eslint-disable jest/no-conditional-expect */
          // This is not conditional, it's guaranteed to throw
          const err = e as Error;
          expect(err).toBeInstanceOf(Error);
          expect(err.message).toContain('prompt is too long');
          expect(reduceMessageTokens).toHaveBeenCalledTimes(4);
          expect(stream).toHaveBeenCalledTimes(5);
          /* eslint-enable jest/no-conditional-expect */
        }
      })();

      const delays = [1000, 2000, 4000, 8000];

      for (const delay of delays) {
        // Yield to the event loop to allow another attempt to be made
        // eslint-disable-next-line no-await-in-loop
        await Promise.resolve();

        // Another yield because the call to `reduceMessageTokens` is async
        await Promise.resolve();

        jest.advanceTimersByTime(delay);
      }

      await consumePromise;
    });
  });

  describe('json', () => {
    const schema = z.object({ answer: z.string() });

    beforeEach(() =>
      jest.spyOn(RunnableBinding.prototype, 'invoke').mockResolvedValue({ answer: '42' })
    );

    it('returns the parsed JSON', async () => {
      const result = await service.json([], schema);
      expect(result).toEqual({ answer: '42' });
    });

    it('emits trajectory events', async () => {
      const events = new Array<TrajectoryEvent>();
      trajectory.on('event', (event) => events.push(event));

      await service.json(
        [
          {
            role: 'user',
            content: 'the question',
          },
        ],
        schema
      );

      expect(events.map((e) => e.message.role)).toEqual(['system', 'user', 'assistant']);
      expect(events.map((e) => e.type)).toEqual(['sent', 'sent', 'received']);
    });
  });
});

function mockAnthropicStream(...chunks: string[]) {
  // eslint-disable-next-line @typescript-eslint/require-await
  jest.spyOn(ChatAnthropic.prototype, 'stream').mockImplementation(async () => {
    // eslint-disable-next-line @typescript-eslint/require-await
    async function* gen(): AsyncGenerator<AIMessageChunk> {
      for (const chunk of chunks) {
        yield new AIMessageChunk({
          content: chunk,
        });
      }
    }
    return IterableReadableStream.fromAsyncGenerator(gen());
  });
}
