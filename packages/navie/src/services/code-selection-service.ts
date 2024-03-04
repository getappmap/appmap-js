import InteractionHistory, { PromptInteractionEvent } from '../interaction-history';
import { PromptType, buildPromptDescriptor, buildPromptValue } from '../prompt';

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

  applyCodeSelection(codeSelection: string) {
    this.interactionHistory.addEvent(
      new PromptInteractionEvent(
        PromptType.CodeSelection,
        'user',
        buildPromptValue(PromptType.CodeSelection, codeSelection)
      )
    );
  }
}
