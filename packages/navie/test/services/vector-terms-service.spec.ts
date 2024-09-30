/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { ChatOpenAI } from '@langchain/openai';

import VectorTermsService from '../../src/services/vector-terms-service';
import InteractionHistory from '../../src/interaction-history';
import { mockAIResponse } from '../fixture';
import OpenAICompletionService from '../../src/services/openai-completion-service';
import Trajectory from '../../src/lib/trajectory';
import MessageTokenReducerService from '../../src/services/message-token-reducer-service';

jest.mock('@langchain/openai');
const completionWithRetry = jest.mocked(ChatOpenAI.prototype.completionWithRetry);

describe('VectorTermsService', () => {
  let interactionHistory: InteractionHistory;
  let service: VectorTermsService;
  let trajectory: Trajectory;

  beforeEach(() => {
    interactionHistory = new InteractionHistory();
    interactionHistory.on('event', (event) => console.log(event.message));
    trajectory = new Trajectory();
    service = new VectorTermsService(
      interactionHistory,
      new OpenAICompletionService('gpt-4', 0.5, trajectory, new MessageTokenReducerService())
    );
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
        expect(terms).toEqual(['user', 'management', 'a']);
        expect(completionWithRetry).toHaveBeenCalledTimes(1);
      });
      it('converts underscore_words to distinct words', async () => {
        mockAIResponse(completionWithRetry, [`["user_management"]`]);
        const terms = await service.suggestTerms('user management');
        expect(terms).toEqual(['user_management']);
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
        expect(terms).toEqual(['response_key:', '-', 'user', 'management']);
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
        expect(terms).toEqual(['-user', '-mgmt']);
        expect(completionWithRetry).toHaveBeenCalledTimes(1);
      });
    });
  });
});
