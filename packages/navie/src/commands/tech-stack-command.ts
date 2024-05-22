import Command from '../command';
import { ChatHistory, ClientRequest } from '../navie';
import TechStackService from '../services/tech-stack-service';

export default class TechStackCommand implements Command {
  constructor(private readonly techStackService: TechStackService) {}

  async *execute(clientRequest: ClientRequest, chatHistory: ChatHistory): AsyncIterable<string> {
    const aggregateQuestion = [
      ...(chatHistory || [])
        .filter((message) => message.role === 'user')
        .map((message) => message.content),
      clientRequest.question,
    ]
      .filter(Boolean)
      .join('\n\n');

    for (const term of await this.techStackService.detectTerms(aggregateQuestion)) {
      yield term;
      yield ' ';
    }
  }
}
