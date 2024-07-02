import { PromptInteractionEvent } from '../interaction-history';
import type Message from '../message';

const DEFAULT_HISTORICAL_MESSAGES = (() => {
  const env = process.env.APPMAP_NAVIE_HISTORICAL_MESSAGES;
  if (env) {
    const value = parseInt(env, 10);
    if (Number.isInteger(value) && value > 0) {
      return value;
    }
  }

  // Default one user message, one assistant message
  return 2;
})();

export default function getMostRecentMessages(
  messages: Message[],
  numMessages = DEFAULT_HISTORICAL_MESSAGES
): PromptInteractionEvent[] {
  // The last message should be the incoming user message, don't include it
  const endIndex = messages.length - 1;
  const startIndex = endIndex - numMessages;
  return messages
    .slice(startIndex, endIndex)
    .filter(Boolean)
    .map(
      ({ role, content }) =>
        new PromptInteractionEvent(
          'historicalMessage',
          role === 'user' ? 'user' : 'assistant',
          content
        )
    );
}
