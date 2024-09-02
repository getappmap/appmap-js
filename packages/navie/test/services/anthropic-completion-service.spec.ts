import AnthropicCompletionService from '../../src/services/anthropic-completion-service';
import InteractionHistory from '../../src/interaction-history';
import { ChatAnthropic } from '@langchain/anthropic';
import { IterableReadableStream } from '@langchain/core/utils/stream';
import { AIMessageChunk } from '@langchain/core/messages';
import { z } from 'zod';
import { RunnableBinding } from '@langchain/core/runnables';
import Trajectory, { TrajectoryEvent } from '../../src/lib/trajectory';

describe('AnthropicCompletionService', () => {
  let interactionHistory: InteractionHistory;
  let trajectory: Trajectory;
  let service: AnthropicCompletionService;
  const modelName = 'anthropic-model';
  const temperature = 0.3;

  const originalEnv = process.env;

  beforeEach(() => {
    process.env['ANTHROPIC_API_KEY'] = 'test-api-key';
    interactionHistory = new InteractionHistory();
    trajectory = new Trajectory();
    service = new AnthropicCompletionService(modelName, temperature, trajectory);
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

    beforeEach(() => mockAnthropicStream('Anthropic completion result'));

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
  });

  describe('json', () => {
    const schema = z.object({ answer: z.string() });

    beforeEach(() =>
      jest.spyOn(RunnableBinding.prototype, 'invoke').mockResolvedValue({ answer: '42' } as any)
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
  jest.spyOn(ChatAnthropic.prototype, 'stream').mockImplementation(async () => {
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
