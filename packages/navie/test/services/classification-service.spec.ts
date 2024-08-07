import { ChatOpenAI } from '@langchain/openai';

import InteractionHistory from '../../src/interaction-history';
import ClassificationService from '../../src/services/classification-service';
import { mockAIResponse } from '../fixture';
import OpenAICompletionService from '../../src/services/openai-completion-service';

jest.mock('@langchain/openai');
const completionWithRetry = jest.mocked(ChatOpenAI.prototype.completionWithRetry);

describe('ClassificationService', () => {
  let interactionHistory: InteractionHistory;
  let service: ClassificationService;

  beforeEach(() => {
    interactionHistory = new InteractionHistory();
    interactionHistory.on('event', (event) => console.log(event.message));
    service = new ClassificationService(
      interactionHistory,
      new OpenAICompletionService('gpt-4', 0.5)
    );
  });
  afterEach(() => jest.resetAllMocks());

  describe('when LLM responds', () => {
    const classification = `
- architecture: high
- troubleshoot: medium
`;

    beforeEach(() => mockAIResponse(completionWithRetry, [classification]));

    it('returns the response', async () => {
      const response = await service.classifyQuestion('user management');
      expect(response).toEqual([
        {
          name: 'architecture',
          weight: 'high',
        },
        {
          name: 'troubleshoot',
          weight: 'medium',
        },
      ]);
      expect(completionWithRetry).toHaveBeenCalledTimes(1);
    });

    it('emits classification event', async () => {
      await service.classifyQuestion('user management');
      expect(
        interactionHistory.events.find((event) => event.metadata.type === 'classification')
          ?.metadata
      ).toEqual({
        type: 'classification',
        classification: ['architecture=high', 'troubleshoot=medium'],
      });
    });
  });
});
