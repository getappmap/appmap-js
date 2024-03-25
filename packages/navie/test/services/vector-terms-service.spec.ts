/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { ChatOpenAI } from '@langchain/openai';

import VectorTermsService from '../../src/services/vector-terms-service';
import InteractionHistory from '../../src/interaction-history';

jest.mock('@langchain/openai');
const completionWithRetry = jest.mocked(ChatOpenAI.prototype.completionWithRetry);

describe('DefaultVectorTermsService', () => {
  let interactionHistory: InteractionHistory;
  let service: VectorTermsService;

  beforeEach(() => {
    interactionHistory = new InteractionHistory();
    interactionHistory.on('event', (event) => console.log(event.message));
    service = new VectorTermsService(interactionHistory, 'gpt-4', 0.5);
  });
  afterEach(() => jest.resetAllMocks());

  function mockAIResponse(responses: string[]): void {
    const choices = responses.map((response, index) => ({
      delta: {
        content: response,
      },
      index,
      finish_reason: 'stop',
    }));
    completionWithRetry.mockResolvedValueOnce([
      {
        id: 'cmpl-3Z5z9J5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5',
        choices,
        created: 1635989729,
        model: 'gpt-3.5',
        object: 'chat.completion.chunk',
      },
    ] as any);
  }

  describe('when LLM suggested terms', () => {
    describe('is a valid JSON object', () => {
      it('is recorded in the interaction history', async () => {
        mockAIResponse([`{"terms": ["user", "management"]}`]);
        const terms = await service.suggestTerms('user management');
        expect(interactionHistory.events.map((e) => ({ ...e }))).toEqual([
          {
            type: 'vectorTerms',
            terms: ['user', 'management'],
          },
        ]);
      });
      it('should return the terms', async () => {
        mockAIResponse([`{"terms": ["user", "management"]}`]);
        const terms = await service.suggestTerms('user management');
        expect(terms).toEqual(['user', 'management']);
        expect(completionWithRetry).toHaveBeenCalledTimes(1);
      });
      it('removes very short terms', async () => {
        mockAIResponse([`["user", "management", "a"]`]);
        const terms = await service.suggestTerms('user management');
        expect(terms).toEqual(['user', 'management']);
        expect(completionWithRetry).toHaveBeenCalledTimes(1);
      });
      it('converts underscore_words to distinct words', async () => {
        mockAIResponse([`["user_management"]`]);
        const terms = await service.suggestTerms('user management');
        expect(terms).toEqual(['user', 'management']);
        expect(completionWithRetry).toHaveBeenCalledTimes(1);
      });
    });
    describe('are a valid JSON list', () => {
      it('should return the terms', async () => {
        mockAIResponse(['["user", "management"]']);
        const terms = await service.suggestTerms('user management');
        expect(terms).toEqual(['user', 'management']);
      });
    });
    describe('are valid JSON wrapped in fences', () => {
      it('should return the terms', async () => {
        mockAIResponse(['```json', '["user", "management"]', '```']);
        const terms = await service.suggestTerms('user management');
        expect(terms).toEqual(['user', 'management']);
      });
    });

    describe('are invalid JSON', () => {
      it('is accepted and processed', async () => {
        mockAIResponse(['-user -mgmt']);
        const terms = await service.suggestTerms('user management');
        expect(terms).toEqual(['user', 'mgmt']);
        expect(completionWithRetry).toHaveBeenCalledTimes(1);
      });
    });
  });
});
