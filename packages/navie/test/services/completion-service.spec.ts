import CompletionService, { Usage, type Completion } from '../../src/services/completion-service';
import Message from '../../src/message';
import { PromptTooLongError } from '../../src/services/completion-service';
import Trajectory from '../../src/lib/trajectory';
import type { ZodType, TypeOf } from 'zod';

class TestCompletionService extends CompletionService {
  // eslint-disable-next-line @typescript-eslint/require-await
  protected async *_complete(): Completion {
    yield 'test';
    return new Usage();
  }

  miniModelName = 'test-model';
  _json<Schema extends ZodType>(): Promise<TypeOf<Schema> | undefined> {
    throw new Error('Method not implemented.');
  }
}

describe('CompletionService', () => {
  let service: TestCompletionService;
  const modelName = 'test-model';
  const temperature = 0.7;
  const trajectory = new Trajectory();

  beforeEach(() => {
    service = new TestCompletionService(modelName, temperature, trajectory);
  });

  describe('token counting', () => {
    it('counts tokens accurately with role overhead', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'world' }
      ];

      const tokenCount = await service.countTokens(messages);
      // Each message content length / CHARACTERS_PER_TOKEN (3) rounded up
      // 'hello' = 2 tokens, 'world' = 2 tokens
      // Plus 1 token per message for role overhead
      expect(tokenCount).toBe(6); // (2 + 1) + (2 + 1)
    });

    it('handles token counting errors with estimation fallback', async () => {
      const messages: Message[] = [{ role: 'user', content: 'test message' }];

      // Mock countMessageTokens to throw an error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(service, 'countMessageTokens').mockRejectedValue(new Error('count failed'));

      const tokenCount = await service.countTokens(messages);
      // 'test message' length (11) / CHARACTERS_PER_TOKEN (3) rounded up = 4
      // Plus 1 for role overhead
      expect(tokenCount).toBe(5);
    });

    it('creates PromptTooLongError with correct parameters', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'test' }
      ];
      const cause = new Error('too long');
      const promptTokens = 100;
      const maxTokens = 50;

      service.maxTokens = maxTokens;

      const error = await service.promptTooLong(messages, cause, promptTokens);
      
      expect(error).toBeInstanceOf(PromptTooLongError);
      expect(error.promptTokens).toBe(promptTokens);
      expect(error.maxTokens).toBe(maxTokens);
      expect(error.cause).toBe(cause);
    });

    it('uses minimum value for maxTokens in PromptTooLongError', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'test' }
      ];
      const cause = new Error('too long');
      const promptTokens = 100;
      
      service.maxTokens = 80;
      const providedMaxTokens = 60;

      const error = await service.promptTooLong(messages, cause, promptTokens, providedMaxTokens);
      
      // Should use min(providedMaxTokens, service.maxTokens, promptTokens - 1)
      expect(error.maxTokens).toBe(60);
    });
  });
});
