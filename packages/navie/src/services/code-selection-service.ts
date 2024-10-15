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

  applyCodeSelection(userContext: string | UserContext.ContextItem[]) {
    const renderedContext: string =
      typeof userContext !== 'string' ? UserContext.renderItems(userContext) : userContext;

    this.interactionHistory.addEvent(
      new PromptInteractionEvent(
        PromptType.CodeSelection,
        'user',
        buildPromptValue(PromptType.CodeSelection, renderedContext)
      )
    );
  }
}
