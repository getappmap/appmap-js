import * as OpenAI from '@langchain/openai';

import InteractionHistory from '../../src/interaction-history';
import OpenAICompletionService from '../../src/services/openai-completion-service';

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
});
