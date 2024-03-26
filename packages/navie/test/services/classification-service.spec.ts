import { ChatOpenAI } from '@langchain/openai';

import InteractionHistory from '../../src/interaction-history';
import ClassificationService from '../../src/services/classification-service';
import { mockAIResponse } from '../fixture';

jest.mock('@langchain/openai');
const completionWithRetry = jest.mocked(ChatOpenAI.prototype.completionWithRetry);

describe('ClassificationService', () => {
  let interactionHistory: InteractionHistory;
  let service: ClassificationService;

  beforeEach(() => {
    interactionHistory = new InteractionHistory();
    interactionHistory.on('event', (event) => console.log(event.message));
    service = new ClassificationService(interactionHistory, 'gpt-4', 0.5);
  });
  afterEach(() => jest.resetAllMocks());

  describe('when LLM responds', () => {
    it('returns the response', async () => {
      mockAIResponse(completionWithRetry, [`Classification: user management`]);
      const response = await service.classifyQuestion('user management');
      expect(response).toEqual(`Classification: user management`);
      expect(completionWithRetry).toHaveBeenCalledTimes(1);
    });
  });
});
