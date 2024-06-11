import Command, { CommandRequest } from '../command';
import VectorTermsService from '../services/vector-terms-service';

export default class VectorTermsCommand implements Command {
  constructor(private readonly vectorTermsService: VectorTermsService) {}

  async *execute(request: CommandRequest): AsyncIterable<string> {
    const { question } = request;

    for (const term of await this.vectorTermsService.suggestTerms(question)) {
      yield term;
      yield ' ';
    }
  }
}
