import type InteractionHistory from '../../interaction-history';
import type { AgentSelectionEvent } from '../../interaction-history';
import PostResponseHook from '../post-response-hook';

/* eslint-disable class-methods-use-this */
export default class PostTestHook implements PostResponseHook {
  condition(interactionHistory: InteractionHistory): boolean {
    const agentSelection = interactionHistory.events.find(
      (e) => e.type === 'agentSelection'
    ) as AgentSelectionEvent;
    return agentSelection.agent === 'test';
  }

  execute() {
    return `

[Create an implementation plan](event:plan)`;
  }
}
/* eslint-enable class-methods-use-this */
