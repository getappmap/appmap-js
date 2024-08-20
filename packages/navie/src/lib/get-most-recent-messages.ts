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

// Selects the last numMessages in a way suitable to provide
// to the LLM as chat history. Since some models require the first
// message to be a user message, make sure it's true by adding
// more messages as necessary.
// Also, fixes up role to always be user or assistant.
export default function getMostRecentMessages(
  messages: Message[],
  numMessages = DEFAULT_HISTORICAL_MESSAGES
): PromptInteractionEvent[] {
  if (numMessages === 0) return [];
  let start = -numMessages;

  // go back to make sure user message is first
  while ((messages.at(start)?.role ?? 'user') !== 'user') start -= 1;
  if (start < -messages.length) {
    // we must have overrun, try going forward instead
    start = 1 - messages.length;
    while ((messages.at(start)?.role ?? 'user') !== 'user') start += 1;
  }

  return messages
    .slice(start)
    .map(
      ({ role, content }) =>
        new PromptInteractionEvent(
          'historicalMessage',
          role === 'user' ? 'user' : 'assistant',
          content
        )
    );
}
