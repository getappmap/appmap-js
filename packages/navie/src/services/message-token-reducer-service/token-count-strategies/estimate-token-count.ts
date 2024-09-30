import Message from '../../../message';
import { TokenCountStrategy } from '../interfaces';

export default class EstimateTokenCount implements TokenCountStrategy {
  constructor(private readonly charactersPerToken = 3) {}

  countTokens(messages: Message[]): number | undefined {
    return messages.reduce((acc, { content }) => acc + content.length, 0) / this.charactersPerToken;
  }
}
