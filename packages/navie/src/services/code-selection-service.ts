import InteractionHistory, { PromptInteractionEvent } from '../interaction-history';
import { PromptType, buildPromptDescriptor, buildPromptValue } from '../prompt';
import { UserContext } from '../user-context';

export default class CodeSelectionService {
  constructor(public interactionHistory: InteractionHistory) {}

  addSystemPrompt() {
    this.interactionHistory.addEvent(
      new PromptInteractionEvent(
        PromptType.CodeSelection,
        'system',
        buildPromptDescriptor(PromptType.CodeSelection)
      )
    );
  }

  applyCodeSelection(userContext: UserContext.Context) {
    if (typeof userContext !== 'string') {
      throw new Error('unimplemented');
    }

    this.interactionHistory.addEvent(
      new PromptInteractionEvent(
        PromptType.CodeSelection,
        'user',
        buildPromptValue(PromptType.CodeSelection, userContext)
      )
    );
  }
}
