import { Message } from '../../../../src';
import ClaudeTokenCountErrorParser from '../../../../src/services/message-token-reducer-service/token-count-strategies/claude-token-count-error-parser';

describe('ClaudeTokenCountErrorParser', () => {
  let parser: ClaudeTokenCountErrorParser;
  const model = 'gpt-4o-2024-08-06';
  const messages: Message[] = [];

  beforeEach(() => {
    parser = new ClaudeTokenCountErrorParser();
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
      message: `prompt is too long: ${tokenLimit + 1} tokens > ${tokenLimit} maximum`,
    });
    expect(result).toBe(tokenLimit + 1);
  });
});
