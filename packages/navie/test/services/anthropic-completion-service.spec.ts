import AnthropicCompletionService from '../../src/services/anthropic-completion-service';
import InteractionHistory from '../../src/interaction-history';
import { ChatAnthropic } from '@langchain/anthropic';
import { IterableReadableStream } from '@langchain/core/utils/stream';
import { AIMessageChunk } from '@langchain/core/messages';

describe('AnthropicCompletionService', () => {
  let interactionHistory: InteractionHistory;
  let service: AnthropicCompletionService;
  const modelName = 'anthropic-model';
  const temperature = 0.3;

  const originalEnv = process.env;

  beforeEach(() => {
    process.env['ANTHROPIC_API_KEY'] = 'test-api-key';
    interactionHistory = new InteractionHistory();
    service = new AnthropicCompletionService(modelName, temperature);
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

  it('completes the question', async () => {
    mockAnthropicStream('Anthropic completion result');
    const messages = [
      { role: 'user', content: 'What is your name?' },
      { role: 'assistant', content: 'I am a bot.' },
    ] as const;
    const completion = service.complete(messages);
    const result: string[] = [];
    for await (const token of completion) {
      result.push(token);
    }
    expect(result).toEqual(['Anthropic completion result']);
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
