import truncateMessages from '../../src/lib/truncate-messages';
import type Message from '../../src/message';

describe('truncateMessages', () => {
  it('returns original messages when no truncation needed', () => {
    const messages: Message[] = [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi' },
    ];
    const result = truncateMessages(messages, 100, 200);
    expect(result).toEqual(messages);
    expect(result).not.toBe(messages); // Should be a new array
  });

  it('returns original messages when no user messages present', () => {
    const messages: Message[] = [
      { role: 'assistant', content: 'hello' },
      { role: 'system', content: 'hi' },
    ];
    const result = truncateMessages(messages, 150, 100);
    expect(result).toEqual(messages);
  });

  it('truncates the largest user message correctly', () => {
    const messages: Message[] = [
      { role: 'user', content: 'small' },
      { role: 'assistant', content: 'medium message' },
      { role: 'user', content: 'this is the largest message' },
    ];
    const totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    const result = truncateMessages(messages, 200, 150);

    expect(result[2].content.length).toBeLessThan(messages[2].content.length);
    expect(result[0]).toEqual(messages[0]);
    expect(result[1]).toEqual(messages[1]);
  });

  it('handles empty message array', () => {
    const messages: Message[] = [];
    const result = truncateMessages(messages, 100, 50);
    expect(result).toEqual([]);
    expect(result).not.toBe(messages);
  });

  it('handles single user message', () => {
    const messages: Message[] = [{ role: 'user', content: 'single message here' }];
    const result = truncateMessages(messages, 100, 50);
    expect(result[0].content.length).toBeLessThan(messages[0].content.length);
  });

  it('handles single large user message', () => {
    const messages: Message[] = [{ role: 'user', content: 'single message here' }];
    const result = truncateMessages(messages, 92421, 32768);
    expect(result[0].content.length).toBeLessThan(messages[0].content.length);
  });

  it('truncates correctly with multiple same-length messages', () => {
    const messages: Message[] = [
      { role: 'user', content: '1234567890' },
      { role: 'assistant', content: 'abcdefghij' },
      { role: 'user', content: '1234567890' },
    ];
    const result = truncateMessages(messages, 100, 50);
    expect(result[0].content.length).toBeLessThan(messages[0].content.length);
    expect(result[2]).toEqual(messages[2]);
  });
});
