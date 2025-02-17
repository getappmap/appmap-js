import { PlanAgent } from '../../src/agents/plan-agent';

import InteractionHistory from '../../src/interaction-history';

describe('PlanAgent', () => {
  let interactionHistory: InteractionHistory;

  beforeEach(() => {
    interactionHistory = new InteractionHistory();
  });

  it('should handle empty question', () => {
    const planAgent = new PlanAgent(interactionHistory, null as never);
    planAgent.applyQuestionPrompt('');
    expect(interactionHistory.events[0]).toMatchInlineSnapshot(`
      PromptInteractionEvent {
        "content": "<problem-statement>
      What is the best way to solve this problem?
      </problem-statement>",
        "name": "problemStatement",
        "prefix": undefined,
        "role": "user",
        "type": "prompt",
      }
    `);
  });
});
