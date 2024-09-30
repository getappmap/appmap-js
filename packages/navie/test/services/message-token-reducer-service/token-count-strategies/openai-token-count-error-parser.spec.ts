import type { Message } from '../../../../src';
import OpenAiTokenCountErrorParser from '../../../../src/services/message-token-reducer-service/token-count-strategies/openai-token-count-error-parser';

describe('OpenAiTokenCountErrorParser', () => {
  let parser: OpenAiTokenCountErrorParser;
  const model = 'gpt-4o-2024-08-06';
  const messages: Message[] = [];

  beforeEach(() => {
    parser = new OpenAiTokenCountErrorParser();
  });

  it('returns undefined if there is no error', () => {
    const result = parser.countTokens(messages, model);
    expect(result).toBeUndefined();
  });

  it('returns undefined if the error does not match the pattern', () => {
    const result = parser.countTokens(messages, model, { message: 'This is not an error' });
    expect(result).toBeUndefined();
  });

  it('returns the token limit if the error matches the pattern', () => {
    const tokenLimit = 16_385;
    const result = parser.countTokens(messages, model, {
      message: `This model's maximum context length is ${tokenLimit} tokens. However, your messages resulted in ${
        tokenLimit + 1
      } tokens. Please reduce the length of the messages.`,
    });
    expect(result).toBe(tokenLimit + 1);
  });
});
