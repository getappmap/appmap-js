import { TokenLimitIdentifier } from '../interfaces';

export default class LookupMaxTokens implements TokenLimitIdentifier {
  private static readonly MAX_TOKENS: Record<string, number> = {
    // OpenAI
    'gpt-3.5-turbo': 16_385,
    'gpt-3.5-turbo-0125': 16_385,
    'gpt-3.5-turbo-1106': 16_385,
    'gpt-3.5-turbo-instruct': 4_096,
    'gpt-4': 8_192,
    'gpt-4-0314': 8_192,
    'gpt-4-0613': 8_192,
    'gpt-4-0125-preview': 128_000,
    'gpt-4-1106-preview': 128_000,
    'gpt-4-turbo-preview': 128_000,
    'gpt-4-turbo-2024-04-09': 128_000,
    'gpt-4-turbo': 128_000,
    'gpt-4o-mini': 128_000,
    'gpt-4o-mini-2024-07-18': 128_000,
    'gpt-4o': 128_000,
    'gpt-4o-2024-05-13': 128_000,
    'gpt-4o-2024-08-06': 128_000,
    'chatgpt-4o-latest': 128_000,
    'o1-preview': 128_000,
    'o1-preview-2024-09-12': 128_000,
    'o1-mini': 128_000,
    'o1-mini-2024-09-12': 128_000,

    // Claude
    // Note that these token limits are subject to change depending on server load.
    'claude-instant-1.2': 100_000,
    'claude-2.0': 100_000,
    'claude-2.1': 200_000,
    'claude-3-5-sonnet-20240620': 200_000,
    'claude-3-opus-20240229': 200_000,
    'claude-3-sonnet-20240229': 200_000,
    'claude-3-haiku-20240307': 200_000,

    // Gemini
    'gemini-pro': 32_760,
    'gemini-1.0-pro': 32_760,
    'gemini-1.0-pro-latest': 32_760,
    'gemini-1.0-pro-001': 32_760,
    'gemini-1.0-pro-vision': 16_384,
    'gemini-1.5-pro': 2_097_152,
    'gemini-1.5-pro-latest': 2_097_152,
    'gemini-1.5-pro-001': 2_097_152,
    'gemini-1.5-pro-002': 2_097_152,
    'gemini-1.5-pro-exp-0827': 2_097_152,
    'gemini-1.5-flash': 1_048_576,
    'gemini-1.5-flash-latest': 1_048_576,
    'gemini-1.5-flash-001': 1_048_576,
    'gemini-1.5-flash-002': 1_048_576,
    'gemini-1.5-flash-8b-exp-0924': 1_048_576,
    'gemini-1.5-flash-8b-exp-0827': 1_048_576,
    'gemini-1.5-flash-exp-0827': 1_048_576,
  };

  getTokenLimit(model: string): number | undefined {
    return LookupMaxTokens.MAX_TOKENS[model];
  }
}
