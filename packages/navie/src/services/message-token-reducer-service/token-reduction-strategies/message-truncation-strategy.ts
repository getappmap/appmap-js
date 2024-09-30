import Message from '../../../message';
import { TokenReductionStrategy } from '../interfaces';

export default class MessageTruncationStrategy implements TokenReductionStrategy {
  constructor(private readonly role: string) {}

  reduceTokens(messages: Message[], currentTokens: number, maxTokens: number): Message[] {
    let largestMessageIndex = -1;
    let totalContentLength = 0;
    messages.forEach((message, index) => {
      totalContentLength += message.content.length;

      const maxLength = messages[largestMessageIndex]?.content?.length ?? -1;
      if (message.role === this.role && message.content.length > maxLength) {
        largestMessageIndex = index;
      }
    });

    if (largestMessageIndex === -1) return [...messages];

    const largestMessage = messages[largestMessageIndex];
    const reductionRatio = 1 - maxTokens / currentTokens;
    const charsToRemove = Math.ceil(reductionRatio * totalContentLength);
    const updatedMessage = { ...messages[largestMessageIndex] };
    updatedMessage.content = largestMessage.content.slice(0, -charsToRemove);

    return [
      ...messages.slice(0, largestMessageIndex),
      updatedMessage,
      ...messages.slice(largestMessageIndex + 1),
    ];
  }
}
