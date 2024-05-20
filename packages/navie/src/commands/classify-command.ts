import Command from '../command';
import { ClientRequest } from '../navie';
import ClassificationService from '../services/classification-service';

export default class ClassifyCommand implements Command {
  constructor(private readonly classificationService: ClassificationService) {}

  async *execute(clientRequest: ClientRequest): AsyncIterable<string> {
    const { question: baseQuestion } = clientRequest;

    const contextLabels = await this.classificationService.classifyQuestion(baseQuestion);
    for (const label of contextLabels) {
      yield `${label.name}=${label.weight}\n`;
    }
  }
}
