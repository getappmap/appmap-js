import ClaudeTokenLimitErrorParser from '../../../../src/services/message-token-reducer-service/token-limit-identifiers/claude-token-limit-error-parser';

describe('ClaudeTokenLimitErrorParser', () => {
  let parser: ClaudeTokenLimitErrorParser;
  const model = 'claude-3-5-sonnet-20240620';

  beforeEach(() => {
    parser = new ClaudeTokenLimitErrorParser();
  });

  it('returns undefined if there is no error', () => {
    const result = parser.getTokenLimit(model);
    expect(result).toBeUndefined();
  });

  it('returns undefined if the error does not match the pattern', () => {
    const result = parser.getTokenLimit(model, { message: 'This is not an error' });
    expect(result).toBeUndefined();
  });

  it('returns the token limit if the error matches the pattern', () => {
    const tokenLimit = 16_385;
    const result = parser.getTokenLimit(model, {
      message: `prompt is too long: ${tokenLimit + 1} tokens > ${tokenLimit} maximum`,
    });
    expect(result).toBe(tokenLimit);
  });
});
