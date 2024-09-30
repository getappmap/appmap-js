import { ApiError, TokenLimitIdentifier } from '../interfaces';

export default class OpenAiTokenLimitErrorParser implements TokenLimitIdentifier {
  getTokenLimit(_model: string, apiError?: ApiError): number | undefined {
    if (!apiError) return undefined;

    const match = /This model's maximum context length is (\d+)/g.exec(apiError.message);
    if (!match) return undefined;

    return parseInt(match[1], 10) || undefined;
  }
}
