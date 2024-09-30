import OpenAiTokenLimitErrorParser from '../../../../src/services/message-token-reducer-service/token-limit-identifiers/openai-token-limit-error-parser';

describe('OpenAiTokenLimitErrorParser', () => {
  let parser: OpenAiTokenLimitErrorParser;

  beforeEach(() => {
    parser = new OpenAiTokenLimitErrorParser();
  });

  it('returns undefined if there is no error', () => {
    const result = parser.getTokenLimit('gpt-4o');
    expect(result).toBeUndefined();
  });

  it('returns undefined if the error does not match the pattern', () => {
    const result = parser.getTokenLimit('gpt-4o', { message: 'This is not an error' });
    expect(result).toBeUndefined();
  });

  it('returns the token limit if the error matches the pattern', () => {
    const tokenLimit = 16_385;
    const result = parser.getTokenLimit('gpt-4o', {
      message: `This model's maximum context length is ${tokenLimit} tokens. However, your messages resulted in ${
        tokenLimit + 1
      } tokens. Please reduce the length of the messages.`,
    });
    expect(result).toBe(tokenLimit);
  });
});
