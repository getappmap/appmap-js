import Command from '../command';
import { ClientRequest } from '../navie';
import VectorTermsService from '../services/vector-terms-service';

export default class VectorTermsCommand implements Command {
  constructor(private readonly vectorTermsService: VectorTermsService) {}

  async *execute(clientRequest: ClientRequest): AsyncIterable<string> {
    const { question } = clientRequest;

    for (const term of await this.vectorTermsService.suggestTerms(question)) {
      yield term;
      yield ' ';
    }
  }
}
