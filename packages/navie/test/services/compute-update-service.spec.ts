import { ChatOpenAI } from '@langchain/openai';

import InteractionHistory from '../../src/interaction-history';
import ClassificationService from '../../src/services/classification-service';
import { mockAIResponse } from '../fixture';
import OpenAICompletionService from '../../src/services/openai-completion-service';
import ComputeUpdateService from '../../src/services/compute-update-service';
import Trajectory from '../../src/lib/trajectory';
import MessageTokenReducerService from '../../src/services/message-token-reducer-service';

jest.mock('@langchain/openai');
const completionWithRetry = jest.mocked(ChatOpenAI.prototype.completionWithRetry);

describe('ComputeUpdateService', () => {
  let interactionHistory: InteractionHistory;
  let trajectory: Trajectory;
  let service: ComputeUpdateService;

  beforeEach(() => {
    interactionHistory = new InteractionHistory();
    interactionHistory.on('event', (event) => console.log(event.message));
    trajectory = new Trajectory();
    service = new ComputeUpdateService(
      interactionHistory,
      new OpenAICompletionService('gpt-4', 0.5, trajectory, new MessageTokenReducerService())
    );
  });
  afterEach(() => jest.resetAllMocks());

  describe('when LLM responds', () => {
    const existingContent = `class User < ApplicationRecord
end`;
    const newContent = `class User < ApplicationRecord
  has_many :posts
end`;

    const change = { original: existingContent, modified: newContent };

    const changeStr = `
<change>
  <original><![CDATA[
class User < ApplicationRecord
end
  ]]></original>
  <modified><![CDATA[
class User < ApplicationRecord
  has_many :posts
end
  ]]></modified>
</change>
    `;

    beforeEach(() => mockAIResponse(completionWithRetry, [changeStr]));

    it('computes the update', async () => {
      const response = await service.computeUpdate(existingContent, newContent);
      expect(response).toStrictEqual(change);
      expect(completionWithRetry).toHaveBeenCalledTimes(1);
    });
  });
});
