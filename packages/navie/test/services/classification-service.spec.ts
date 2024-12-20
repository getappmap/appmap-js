import InteractionHistory from '../../src/interaction-history';
import ClassificationService from '../../src/services/classification-service';

import MockCompletionService from './mock-completion-service';

describe('ClassificationService', () => {
  let interactionHistory: InteractionHistory;
  let service: ClassificationService;
  const completion = new MockCompletionService();
  const completeSpy = jest.spyOn(completion, 'json');

  beforeEach(() => {
    interactionHistory = new InteractionHistory();
    interactionHistory.on('event', (event) => console.log(event.message));
    service = new ClassificationService(interactionHistory, completion);
  });
  afterEach(() => jest.restoreAllMocks());

  describe('when LLM responds', () => {
    const classification = `
{ "architecture": "high",
"troubleshoot": "medium" }
`;

    beforeEach(() => completion.mock(classification));

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
      expect(completeSpy).toHaveBeenCalledTimes(1);
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
