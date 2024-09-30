import LookupMaxTokens from '../../../../src/services/message-token-reducer-service/token-limit-identifiers/lookup-max-tokens';

describe('LookupMaxTokens', () => {
  let service: LookupMaxTokens;

  beforeEach(() => {
    service = new LookupMaxTokens();
  });

  it('returns undefined if the model is unknown', () => {
    const result = service.getTokenLimit('unknown-model');
    expect(result).toBeUndefined();
  });

  it('returns the token limit for the given model', () => {
    const result = service.getTokenLimit('gpt-4o-2024-08-06');
    expect(result).toBe(128_000);
  });
});
