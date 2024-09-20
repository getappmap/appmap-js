import type Message from '../message';

// Reduces the size of the largest user message by the given percentage of all messages content length
export default function trimLargestUserMessage(
  messages: readonly Message[],
  reduceBy = 0.15
): Message[] {
  let largestMessageIndex = -1;
  let contentLength = 0;
  messages.forEach((message, index) => {
    contentLength += message.content.length;

    const maxLength = messages[largestMessageIndex]?.content?.length ?? -1;
    if (message.role === 'user' && message.content.length > maxLength) {
      largestMessageIndex = index;
    }
  });

  if (largestMessageIndex === -1) return [...messages];

  const largestMessage = messages[largestMessageIndex];
  const charsToRemove = Math.ceil(contentLength * reduceBy);
  const updatedMessage = { ...messages[largestMessageIndex] };
  updatedMessage.content = largestMessage.content.slice(0, -charsToRemove);

  return [
    ...messages.slice(0, largestMessageIndex),
    updatedMessage,
    ...messages.slice(largestMessageIndex + 1),
  ];
}
