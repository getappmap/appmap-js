import Command, { CommandRequest } from '../command';
import { ChatHistory } from '../navie';
import TechStackService from '../services/tech-stack-service';

export default class TechStackCommand implements Command {
  constructor(private readonly techStackService: TechStackService) {}

  async *execute(request: CommandRequest, chatHistory: ChatHistory): AsyncIterable<string> {
    const aggregateQuestion = [
      ...(chatHistory || [])
        .filter((message) => message.role === 'user')
        .map((message) => message.content),
      request.question,
    ]
      .filter(Boolean)
      .join('\n\n');

    for (const term of await this.techStackService.detectTerms(aggregateQuestion)) {
      yield term;
      yield ' ';
    }
  }
}
