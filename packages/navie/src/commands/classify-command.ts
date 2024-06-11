import Command, { CommandRequest } from '../command';
import { ChatHistory } from '../navie';
import ClassificationService from '../services/classification-service';

export default class ClassifyCommand implements Command {
  constructor(private readonly classificationService: ClassificationService) {}

  async *execute(request: CommandRequest, chatHistory?: ChatHistory): AsyncIterable<string> {
    const { question: baseQuestion } = request;

    const contextLabels = await this.classificationService.classifyQuestion(
      baseQuestion,
      chatHistory
    );
    for (const label of contextLabels) {
      yield `${label.name}=${label.weight}\n`;
    }
  }
}
