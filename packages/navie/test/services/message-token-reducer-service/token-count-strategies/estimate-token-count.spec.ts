import EstimateTokenCount from '../../../../src/services/message-token-reducer-service/token-count-strategies/estimate-token-count';

describe('EstimateTokenCount', () => {
  it('returns zero if there are no messages', () => {
    const estimate = new EstimateTokenCount();
    const result = estimate.countTokens([]);
    expect(result).toBe(0);
  });

  it('returns the number of characters divided by the characters per token', () => {
    const estimate = new EstimateTokenCount(2);
    const result = estimate.countTokens([{ content: 'Four', role: 'user' }]);
    expect(result).toBe(2);
  });

  it('defaults to 3 characters per token', () => {
    const estimate = new EstimateTokenCount();
    const result = estimate.countTokens([{ content: 'abcabc', role: 'user' }]);
    expect(result).toBe(2);
  });
});
