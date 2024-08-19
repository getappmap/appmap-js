import Command, { CommandRequest } from '../command';
import { ChatHistory } from '../navie';
import NextStepClassificationService from '../services/next-step-classification-service';

export default class SuggestCommand implements Command {
  constructor(private readonly nextStepService: NextStepClassificationService) {}

  async *execute(_: CommandRequest, chatHistory?: ChatHistory): AsyncIterable<string> {
    const nextSteps = await this.nextStepService.getNextSteps(chatHistory ?? []);
    yield JSON.stringify(nextSteps);
  }
}
