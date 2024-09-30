import Message from '../../../message';
import { ApiError, TokenCountStrategy } from '../interfaces';

export default class OpenAiTokenCountErrorParser implements TokenCountStrategy {
  countTokens(_messages: Message[], _model: string, apiError?: ApiError): number | undefined {
    if (!apiError) return undefined;

    const match = /However, your messages resulted in (\d+) tokens./g.exec(apiError.message);
    if (!match) return undefined;

    return parseInt(match[1], 10) || undefined;
  }
}
