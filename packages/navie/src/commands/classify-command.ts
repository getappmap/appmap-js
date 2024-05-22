import Command from '../command';
import { ChatHistory, ClientRequest } from '../navie';
import ClassificationService from '../services/classification-service';

export default class ClassifyCommand implements Command {
  constructor(private readonly classificationService: ClassificationService) {}

  async *execute(clientRequest: ClientRequest, chatHistory?: ChatHistory): AsyncIterable<string> {
    const { question: baseQuestion } = clientRequest;

    const contextLabels = await this.classificationService.classifyQuestion(
      baseQuestion,
      chatHistory
    );
    for (const label of contextLabels) {
      yield `${label.name}=${label.weight}\n`;
    }
  }
}
