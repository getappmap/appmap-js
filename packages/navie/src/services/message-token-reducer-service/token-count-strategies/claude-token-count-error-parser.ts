import Message from '../../../message';
import { ApiError, TokenCountStrategy } from '../interfaces';

export default class ClaudeTokenCountErrorParser implements TokenCountStrategy {
  countTokens(_messages: Message[], _model: string, apiError?: ApiError): number | undefined {
    if (!apiError) return undefined;

    const match = /prompt is too long: (\d+) tokens > \d+ maximum/g.exec(apiError.message);
    if (!match) return undefined;

    return parseInt(match[1], 10) || undefined;
  }
}
