import * as OpenAI from '@langchain/openai';

import InteractionHistory from '../../src/interaction-history';
import { OpenAICompletionService } from '../../src/services/completion-service';

jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn(),
}));

describe('CompletionService', () => {
  let interactionHistory: InteractionHistory;
  let service: OpenAICompletionService;
  const modelName = 'the-model-name';
  const temperature = 0.2;

  beforeEach(() => {
    interactionHistory = new InteractionHistory();
    service = new OpenAICompletionService(interactionHistory, modelName, temperature);
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
    let openAI: jest.Mock;
    let completionWithRetry: jest.Mock;

    beforeEach(() => {
      completionWithRetry = jest.fn().mockImplementation(async function* () {
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
      });

      openAI = OpenAI.ChatOpenAI as unknown as jest.Mock;
      openAI.mockImplementation(
        () =>
          ({
            completionWithRetry,
          } as unknown as OpenAI.ChatOpenAI)
      );
    });

    const complete = async (options: { temperature: number | undefined }) => {
      const tokens = service.complete(options);
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
        expect(openAI).toHaveBeenCalledWith(expect.objectContaining({ temperature: 0.5 }));
      });
    });
  });
});
