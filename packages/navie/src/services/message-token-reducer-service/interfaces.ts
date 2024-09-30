import Message from '../../message';

export interface ApiError {
  message: string;
}

export interface TokenLimitIdentifier {
  getTokenLimit(model: string, apiError?: ApiError): number | undefined;
}

export interface TokenCountStrategy {
  countTokens(message: Message[], model: string, apiError?: ApiError): number | undefined;
}

export interface TokenReductionStrategy {
  reduceTokens(
    messages: Message[],
    currentTokens: number,
    maxTokens: number
  ): Promise<Message[]> | Message[];
}
