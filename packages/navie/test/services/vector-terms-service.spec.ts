/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { ChatOpenAI } from '@langchain/openai';

import VectorTermsService from '../../src/services/vector-terms-service';
import InteractionHistory from '../../src/interaction-history';
import { mockAIResponse } from '../fixture';

jest.mock('@langchain/openai');
const completionWithRetry = jest.mocked(ChatOpenAI.prototype.completionWithRetry);

describe('VectorTermsService', () => {
  let interactionHistory: InteractionHistory;
  let service: VectorTermsService;

  beforeEach(() => {
    interactionHistory = new InteractionHistory();
    interactionHistory.on('event', (event) => console.log(event.message));
    service = new VectorTermsService(interactionHistory, 'gpt-4', 0.5);
  });
  afterEach(() => jest.resetAllMocks());

  describe('when LLM suggested terms', () => {
    describe('is a valid JSON object', () => {
      it('is recorded in the interaction history', async () => {
        mockAIResponse(completionWithRetry, [`{"terms": ["user", "management"]}`]);
        await service.suggestTerms('user management');
        expect(interactionHistory.events.map((e) => ({ ...e }))).toEqual([
          {
            type: 'vectorTerms',
            terms: ['user', 'management'],
          },
        ]);
      });
      it('should return the terms', async () => {
        mockAIResponse(completionWithRetry, [`{"terms": ["user", "management"]}`]);
        const terms = await service.suggestTerms('user management');
        expect(terms).toEqual(['user', 'management']);
        expect(completionWithRetry).toHaveBeenCalledTimes(1);
      });
      it('removes very short terms', async () => {
        mockAIResponse(completionWithRetry, [`["user", "management", "a"]`]);
        const terms = await service.suggestTerms('user management');
        expect(terms).toEqual(['user', 'management']);
        expect(completionWithRetry).toHaveBeenCalledTimes(1);
      });
      it('converts underscore_words to distinct words', async () => {
        mockAIResponse(completionWithRetry, [`["user_management"]`]);
        const terms = await service.suggestTerms('user management');
        expect(terms).toEqual(['user', 'management']);
        expect(completionWithRetry).toHaveBeenCalledTimes(1);
      });
    });

    describe('are a valid JSON list', () => {
      it('should return the terms', async () => {
        mockAIResponse(completionWithRetry, ['["user", "management"]']);
        const terms = await service.suggestTerms('user management');
        expect(terms).toEqual(['user', 'management']);
      });
    });

    describe('are valid JSON wrapped in fences', () => {
      it('should return the terms', async () => {
        mockAIResponse(completionWithRetry, ['```json\n', '["user", "management"]\n', '```\n']);
        const terms = await service.suggestTerms('user management');
        expect(terms).toEqual(['user', 'management']);
      });
    });

    describe('is YAML', () => {
      it('parses the terms', async () => {
        mockAIResponse(completionWithRetry, ['response_key:\n', '  - user\n', '  - management\n']);
        const terms = await service.suggestTerms('user management');
        expect(terms).toEqual(['response', 'key', 'user', 'management']);
      });
    });

    describe('is prefixed by "Terms:"', () => {
      it('is accepted and processed', async () => {
        mockAIResponse(completionWithRetry, ['Terms: ["user", "management"]']);
        const terms = await service.suggestTerms('user management');
        expect(terms).toEqual(['user', 'management']);
        expect(completionWithRetry).toHaveBeenCalledTimes(1);
      });
    });

    describe('includes terms with "+" prefix', () => {
      it('is accepted and processed', async () => {
        mockAIResponse(completionWithRetry, ['Terms: +user management']);
        const terms = await service.suggestTerms('user management');
        expect(terms).toEqual(['+user', 'management']);
        expect(completionWithRetry).toHaveBeenCalledTimes(1);
      });
    });

    describe('is list-ish ', () => {
      it('is accepted and processed', async () => {
        mockAIResponse(completionWithRetry, ['-user -mgmt']);
        const terms = await service.suggestTerms('user management');
        expect(terms).toEqual(['user', 'mgmt']);
        expect(completionWithRetry).toHaveBeenCalledTimes(1);
      });
    });

    describe('terms are empty', () => {
      it('falls back to the user input', async () => {
        const examples = ['', 'Terms: ', '{}', '```json\n[]\n```'];
        const expected = ['user', 'management'];

        for (let i = 0; i < examples.length; i++) {
          const example = examples[i];
          mockAIResponse(completionWithRetry, [example]);
          const terms = await service.suggestTerms('user management');
          expect(terms).toEqual(expected);
          expect(completionWithRetry).toHaveBeenCalledTimes(i + 1);
        }
      });
    });
  });
});
