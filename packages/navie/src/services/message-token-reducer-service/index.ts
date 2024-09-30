import ClaudeTokenCountErrorParser from './token-count-strategies/claude-token-count-error-parser';
import OpenAiTokenCountErrorParser from './token-count-strategies/openai-token-count-error-parser';
import ClaudeTokenLimitErrorParser from './token-limit-identifiers/claude-token-limit-error-parser';
import OpenAiTokenLimitErrorParser from './token-limit-identifiers/openai-token-limit-error-parser';
import MessageTruncationStrategy from './token-reduction-strategies/message-truncation-strategy';
import EstimateTokenCount from './token-count-strategies/estimate-token-count';
import LookupMaxTokens from './token-limit-identifiers/lookup-max-tokens';
import type Message from '../../message';
import type {
  ApiError,
  TokenCountStrategy,
  TokenLimitIdentifier,
  TokenReductionStrategy,
} from './interfaces';
import { CHARACTERS_PER_TOKEN } from '../../message';

class TokenError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export default class MessageTokenReducerService {
  private static readonly tokenLimitStrategies: TokenLimitIdentifier[] = [
    /* 
      Use errors before the lookup table. Context limits may be dynamic.
      E.g., OpenAI may update a model pointer or Claude may throttle context limits
      during peak usage (https://support.anthropic.com/en/articles/8241175-how-do-i-increase-my-usage-limits).
    */
    new OpenAiTokenLimitErrorParser(),
    new ClaudeTokenLimitErrorParser(),
    new LookupMaxTokens(),
  ];

  private static readonly tokenCountStrategies: TokenCountStrategy[] = [
    new OpenAiTokenCountErrorParser(),
    new ClaudeTokenCountErrorParser(),
    new EstimateTokenCount(CHARACTERS_PER_TOKEN),
  ];

  private static readonly tokenReductionStrategies: TokenReductionStrategy[] = [
    new MessageTruncationStrategy('user'),
  ];

  constructor(private readonly defaultTokenLimit = 32_768) {}

  private getTokenLimit(model: string, apiError?: ApiError): number | undefined {
    for (const strategy of MessageTokenReducerService.tokenLimitStrategies) {
      const tokenLimit = strategy.getTokenLimit(model, apiError);
      if (tokenLimit !== undefined) return tokenLimit;
    }
  }

  private countTokens(messages: Message[], model: string, apiError?: ApiError): number | undefined {
    for (const strategy of MessageTokenReducerService.tokenCountStrategies) {
      const tokenCount = strategy.countTokens(messages, model, apiError);
      if (tokenCount !== undefined) return tokenCount;
    }
  }

  async reduceMessageTokens(
    messages: Message[],
    model: string,
    apiError?: ApiError
  ): Promise<Message[]> {
    let tokenLimit = this.getTokenLimit(model, apiError);
    if (!tokenLimit) {
      // We can either throw an error or guess a relatively reasonable token limit.
      // For now, we'll assume the default token limit.
      tokenLimit = this.defaultTokenLimit;
    }

    let errorConsumed = false;
    let result = [...messages];

    for (const strategy of MessageTokenReducerService.tokenReductionStrategies) {
      const tokenCount = this.countTokens(result, model, errorConsumed ? undefined : apiError);
      if (tokenCount === undefined) {
        throw new TokenError('Unable to count tokens');
      }

      if (tokenCount > tokenLimit) {
        result = await strategy.reduceTokens(result, tokenCount, tokenLimit);
        errorConsumed = true;
      } else {
        break;
      }
    }

    return result;
  }
}
