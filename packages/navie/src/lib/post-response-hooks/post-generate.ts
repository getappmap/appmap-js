import type InteractionHistory from '../../interaction-history';
import type { AgentSelectionEvent } from '../../interaction-history';
import PostResponseHook from '../post-response-hook';

/* eslint-disable class-methods-use-this */
export default class PostGenerateHook implements PostResponseHook {
  condition(interactionHistory: InteractionHistory): boolean {
    const agentSelection = interactionHistory.events.find(
      (e) => e.type === 'agentSelection'
    ) as AgentSelectionEvent;
    return agentSelection.agent === 'generate';
  }

  execute() {
    return `

[Write tests](event:test-cases)`;
  }
}
/* eslint-enable class-methods-use-this */
