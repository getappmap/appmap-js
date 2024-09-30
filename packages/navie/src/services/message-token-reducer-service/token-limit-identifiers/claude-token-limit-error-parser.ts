import { ApiError, TokenLimitIdentifier } from '../interfaces';

export default class ClaudeTokenLimitErrorParser implements TokenLimitIdentifier {
  getTokenLimit(_model: string, apiError?: ApiError): number | undefined {
    if (!apiError) return undefined;

    const match = /prompt is too long: \d+ tokens > (\d+) maximum/g.exec(apiError.message);
    if (!match) return undefined;

    return parseInt(match[1], 10) || undefined;
  }
}
