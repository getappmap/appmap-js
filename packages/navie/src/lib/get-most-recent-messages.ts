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

function filterNonConversationalMessages(messages: Message[]): Message[] {
  const filteredMessages = [];
  for (let i = 0; i < messages.length; i += 1) {
    const message = messages[i];
    if (message.role === 'user' && message.content.match(/^\s*@suggest/)) {
      // Skip the next message as well - it's the assistant's response
      i += 1;
      continue;
    }

    filteredMessages.push(message);
  }

  return filteredMessages;
}

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
  const filteredMessages = filterNonConversationalMessages(messages);
  let start = -Math.min(numMessages, filteredMessages.length);

  // go back to make sure user message is first
  while ((filteredMessages.at(start)?.role ?? 'user') !== 'user') start -= 1;
  if (start < -filteredMessages.length) {
    // we must have overrun, try going forward instead
    start = 1 - filteredMessages.length;
    while ((filteredMessages.at(start)?.role ?? 'user') !== 'user') start += 1;
  }

  return filteredMessages
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
