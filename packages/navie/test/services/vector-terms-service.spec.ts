import VectorTermsService from '../../src/services/vector-terms-service';
import InteractionHistory from '../../src/interaction-history';
import MockCompletionService from './mock-completion-service';

describe('VectorTermsService', () => {
  let interactionHistory: InteractionHistory;
  let service: VectorTermsService;
  const completion = new MockCompletionService();
  const complete = jest.spyOn(completion, 'complete');

  beforeEach(() => {
    interactionHistory = new InteractionHistory();
    interactionHistory.on('event', (event) => console.log(event.message));
    service = new VectorTermsService(interactionHistory, completion);
  });
  afterEach(() => jest.restoreAllMocks());

  describe('when LLM suggested terms', () => {
    describe('is a valid JSON object', () => {
      it('is recorded in the interaction history', async () => {
        completion.mock(`{"terms": ["user", "management"]}`);
        await service.suggestTerms('user management');
        expect(interactionHistory.events.map((e) => ({ ...e }))).toEqual([
          {
            type: 'vectorTerms',
            terms: ['user', 'management'],
          },
        ]);
      });
      it('should return the terms', async () => {
        completion.mock(`{"terms": ["user", "management"]}`);
        const terms = await service.suggestTerms('user management');
        expect(terms).toEqual(['user', 'management']);
        expect(complete).toHaveBeenCalledTimes(1);
      });
      it('removes very short terms', async () => {
        completion.mock(`["user", "management", "a"]`);
        const terms = await service.suggestTerms('user management');
        expect(terms).toEqual(['user', 'management', 'a']);
        expect(complete).toHaveBeenCalledTimes(1);
      });
      it('converts underscore_words to distinct words', async () => {
        completion.mock(`["user_management"]`);
        const terms = await service.suggestTerms('user management');
        expect(terms).toEqual(['user_management']);
        expect(complete).toHaveBeenCalledTimes(1);
      });
    });

    describe('are a valid JSON list', () => {
      it('should return the terms', async () => {
        completion.mock('["user", "management"]');
        const terms = await service.suggestTerms('user management');
        expect(terms).toEqual(['user', 'management']);
      });
    });

    describe('are valid JSON wrapped in fences', () => {
      it('should return the terms', async () => {
        completion.mock('```json\n["user", "management"]\n```\n');
        const terms = await service.suggestTerms('user management');
        expect(terms).toEqual(['user', 'management']);
      });
    });

    describe('is YAML', () => {
      it('parses the terms', async () => {
        completion.mock('response_key:\n', '  - user\n', '  - management\n');
        const terms = await service.suggestTerms('user management');
        expect(terms).toEqual(['response_key:', '-', 'user', 'management']);
      });
    });

    describe('is prefixed by "Terms:"', () => {
      it('is accepted and processed', async () => {
        completion.mock('Terms: ["user", "management"]');
        const terms = await service.suggestTerms('user management');
        expect(terms).toEqual(['user', 'management']);
        expect(complete).toHaveBeenCalledTimes(1);
      });
    });

    describe('includes terms with "+" prefix', () => {
      it('is accepted and processed', async () => {
        completion.mock('Terms: +user management');
        const terms = await service.suggestTerms('user management');
        expect(terms).toEqual(['+user', 'management']);
        expect(complete).toHaveBeenCalledTimes(1);
      });
    });

    describe('is list-ish', () => {
      it('is accepted and processed', async () => {
        completion.mock('-user -mgmt');
        const terms = await service.suggestTerms('user management');
        expect(terms).toEqual(['-user', '-mgmt']);
        expect(complete).toHaveBeenCalledTimes(1);
      });
    });
  });
});
