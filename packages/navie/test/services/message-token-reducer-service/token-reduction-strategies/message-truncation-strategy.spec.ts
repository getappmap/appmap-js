import { Message } from '../../../../src';
import MessageTruncationStrategy from '../../../../src/services/message-token-reducer-service/token-reduction-strategies/message-truncation-strategy';

describe('MessageTruncationStrategy', () => {
  let strategy: MessageTruncationStrategy;

  beforeEach(() => {
    strategy = new MessageTruncationStrategy('user');
  });

  it('returns the original messages if there are no messages', () => {
    const messages: Message[] = [];
    const result = strategy.reduceTokens(messages, 0, 0);
    expect(result).toEqual(messages);
  });

  it('trims the largest message by the given parameters', () => {
    const messages: Message[] = [
      { content: 'Hello world!', role: 'system' },
      { content: 'This is the largest message.', role: 'user' },
      { content: 'Short message.', role: 'assistant' },
    ];
    const numCharacters = messages.reduce((acc, { content }) => acc + content.length, 0);
    const result = strategy.reduceTokens(messages, numCharacters, numCharacters - 8);
    const expected = [
      { content: 'Hello world!', role: 'system' },
      { content: 'This is the largest ', role: 'user' },
      { content: 'Short message.', role: 'assistant' },
    ];
    expect(result).toEqual(expected);
  });

  it('only trims messages matching the role given to the constructor', () => {
    const messages: Message[] = [
      { content: 'This is the largest message.', role: 'system' },
      { content: 'Hello world!', role: 'user' },
      { content: 'Short message.', role: 'assistant' },
    ];
    const numCharacters = messages.reduce((acc, { content }) => acc + content.length, 0);
    const result = strategy.reduceTokens(messages, numCharacters, numCharacters - 6);
    const expected = [
      { content: 'This is the largest message.', role: 'system' },
      { content: 'Hello', role: 'user' },
      { content: 'Short message.', role: 'assistant' },
    ];
    expect(result).toEqual(expected);
  });
});
