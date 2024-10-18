import InteractionHistory from '../../src/interaction-history';
import ComputeUpdateService from '../../src/services/compute-update-service';

import MockCompletionService from './mock-completion-service';

describe('ComputeUpdateService', () => {
  let interactionHistory: InteractionHistory;
  let service: ComputeUpdateService;
  const completion = new MockCompletionService();
  const complete = jest.spyOn(completion, 'complete');

  beforeEach(() => {
    interactionHistory = new InteractionHistory();
    interactionHistory.on('event', (event) => console.log(event.message));
    service = new ComputeUpdateService(interactionHistory, completion);
  });
  afterEach(() => jest.restoreAllMocks());

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

    beforeEach(() => completion.mock(changeStr));

    it('computes the update', async () => {
      const response = await service.computeUpdate(existingContent, newContent);
      expect(response).toStrictEqual(change);
      expect(complete).toHaveBeenCalledTimes(1);
    });
  });
});
