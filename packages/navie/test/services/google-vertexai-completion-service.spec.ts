/* eslint-disable @typescript-eslint/naming-convention */
import { ChatVertexAI } from '@langchain/google-vertexai-web';

import Trajectory from '../../src/lib/trajectory';
import GoogleVertexAICompletionService from '../../src/services/google-vertexai-completion-service';
import { z } from 'zod';
import Message from '../../src/message';

jest.mock('@langchain/google-vertexai-web');

describe('GoogleVertexAICompletionService', () => {
  let service: GoogleVertexAICompletionService;
  let trajectory: Trajectory;
  const modelName = 'the-model-name';
  const temperature = 0.2;

  beforeEach(() => {
    trajectory = new Trajectory();
    service = new GoogleVertexAICompletionService(modelName, temperature, trajectory);
  });

  const ChatVertexAIMock = jest.mocked(ChatVertexAI);
  const responseMock = jest.fn<string, []>();
  function mockCompletion(response: string) {
    responseMock.mockReturnValue(response);
  }

  beforeEach(() =>
    ChatVertexAIMock.mockImplementation(
      () =>
        ({
          // eslint-disable-next-line @typescript-eslint/require-await
          stream: jest.fn(async function* () {
            yield { content: responseMock() };
          }),
          invoke() {
            return { content: responseMock() };
          },
        } as never)
    )
  );
  afterEach(jest.resetAllMocks);

  describe('complete', () => {
    it('returns the parsed completion', async () => {
      mockCompletion('hello world');
      const messages: Message[] = [];

      expect(await collect(service.complete(messages))).toEqual(['hello world']);
    });

    it('retries on errors', async () => {
      mockCompletion('hello world');
      responseMock.mockImplementationOnce(() => {
        throw new Error('error');
      });
      const messages: Message[] = [];

      jest.useFakeTimers();
      const result = collect(service.complete(messages));
      await jest.runAllTimersAsync();
      jest.useRealTimers();
      expect(await result).toEqual(['hello world']);
    });
  });

  describe('json', () => {
    it('returns the parsed JSON', async () => {
      mockCompletion('{"foo": "bar"}');
      const schema = z.object({ foo: z.string() });
      const messages: Message[] = [];
      const result = await service.json(messages, schema);
      expect(result).toEqual({ foo: 'bar' });
    });

    it('retries on errors', async () => {
      jest.useFakeTimers();
      mockCompletion('{"foo": "bar"}');
      responseMock.mockImplementationOnce(() => {
        throw new Error('error');
      });
      const schema = z.object({ foo: z.string() });
      const messages: Message[] = [];
      const result = service.json(messages, schema);
      await jest.runAllTimersAsync();
      expect(await result).toEqual({ foo: 'bar' });
      jest.useRealTimers();
    });

    it('retries on bad JSON', async () => {
      jest.useFakeTimers();
      mockCompletion('{"foo": "bar"}');
      responseMock.mockReturnValueOnce('{"foo": "bar"');
      const schema = z.object({ foo: z.string() });
      const messages: Message[] = [];
      const result = service.json(messages, schema);
      await jest.runAllTimersAsync();
      expect(await result).toEqual({ foo: 'bar' });
      jest.useRealTimers();
    });
  });

  describe('miniModelName', () => {
    it('returns the default mini model name', () => {
      expect(service.miniModelName).toEqual('gemini-1.5-flash-002');
    });

    it('overrides the mini model name with the environment variable', () => {
      const miniModelName = 'the-mini-model-name';
      process.env.APPMAP_NAVIE_MINI_MODEL = miniModelName;
      expect(service.miniModelName).toEqual(miniModelName);
    });
  });
});

async function collect(generator: AsyncIterable<string>): Promise<string[]> {
  const chunks: string[] = [];
  for await (const chunk of generator) {
    chunks.push(chunk);
  }
  return chunks;
}
