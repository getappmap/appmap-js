import trimLargestMessage from '../../src/lib/trim-largest-user-message';
import type Message from '../../src/message';

describe('trimLargestMessage', () => {
  it('returns the original messages if there are no messages', () => {
    const messages: Message[] = [];
    const result = trimLargestMessage(messages, 0.2);
    expect(result).toEqual(messages);
  });

  it('trims the largest message by the default percentage', () => {
    const messages: Message[] = [
      { content: 'Hello world!', role: 'system' },
      { content: 'This is the largest message.', role: 'user' },
      { content: 'Short message.', role: 'assistant' },
    ];
    const result = trimLargestMessage(messages);
    const expected = [
      { content: 'Hello world!', role: 'system' },
      { content: 'This is the largest', role: 'user' },
      { content: 'Short message.', role: 'assistant' },
    ];
    expect(result).toEqual(expected);
  });

  it('trims the largest message by a specified percentage', () => {
    const messages: Message[] = [
      { content: 'Hello world!', role: 'system' },
      { content: 'This is the largest message.', role: 'user' },
      { content: 'Short message.', role: 'assistant' },
    ];
    const result = trimLargestMessage(messages, 0.44);
    const expected = [
      { content: 'Hello world!', role: 'system' },
      { content: 'This', role: 'user' },
      { content: 'Short message.', role: 'assistant' },
    ];
    expect(result).toEqual(expected);
  });

  it('does not trim the largest message if the role is not user', () => {
    const messages: Message[] = [
      { content: 'This is the largest message.', role: 'system' },
      { content: 'Hello world!', role: 'user' },
      { content: 'Short message.', role: 'assistant' },
    ];
    const result = trimLargestMessage(messages, 0.12);
    const expected = [
      { content: 'This is the largest message.', role: 'system' },
      { content: 'Hello', role: 'user' },
      { content: 'Short message.', role: 'assistant' },
    ];
    expect(result).toEqual(expected);
  });
});
