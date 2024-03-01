import InteractionHistory, { PromptInteractionEvent } from '../interaction-history';
import { PromptType, buildPromptDescriptor, buildPromptValue } from '../prompt';

export default class QuestionService {
  constructor(public interactionHistory: InteractionHistory) {}

  applyQuestion(question: string) {
    this.interactionHistory.addEvent(
      new PromptInteractionEvent(
        PromptType.Question,
        'system',
        buildPromptDescriptor(PromptType.Question)
      )
    );

    this.interactionHistory.addEvent(
      new PromptInteractionEvent(
        PromptType.Question,
        'user',
        buildPromptValue(PromptType.Question, question)
      )
    );
  }
}
