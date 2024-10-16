import VectorTermsService from '../../src/services/vector-terms-service';
import InteractionHistory from '../../src/interaction-history';

import MockCompletionService from './mock-completion-service';

describe('VectorTermsService', () => {
  describe('when LLM suggested terms', () => {
    it('is recorded in the interaction history', async () => {
      completion.mock({
        context: 'ctx',
        instructions: 'insns',
        terms: ['user', 'management', '+provider'],
      });
      await service.suggestTerms('user management');
      expect(interactionHistory.events).toEqual([
        expect.objectContaining({
          type: 'vectorTerms',
          terms: ['user', 'management', '+provider'],
        }),
      ]);
    });
  });

  let interactionHistory: InteractionHistory;
  let service: VectorTermsService;

  beforeEach(() => {
    interactionHistory = new InteractionHistory();
    service = new VectorTermsService(interactionHistory, completion);
  });
  afterEach(() => jest.resetAllMocks());
  const completion = new MockCompletionService();
});
