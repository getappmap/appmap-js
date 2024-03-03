import InteractionHistory, { PromptInteractionEvent } from '../interaction-history';
import { PromptType, buildPromptDescriptor, buildPromptValue } from '../prompt';

export default class QuestionService {
  constructor(public interactionHistory: InteractionHistory) {}

  addSystemPrompt() {
    this.interactionHistory.addEvent(
      new PromptInteractionEvent(
        PromptType.Question,
        'system',
        buildPromptDescriptor(PromptType.Question)
      )
    );
  }

  applyQuestion(question: string) {
    this.interactionHistory.addEvent(
      new PromptInteractionEvent(
        PromptType.Question,
        'user',
        buildPromptValue(PromptType.Question, question)
      )
    );
  }
}
