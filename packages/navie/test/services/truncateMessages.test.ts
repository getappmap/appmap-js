import { describe, it, expect } from '@jest/globals';
import { truncateMessages } from '../../src/services/completion-service';
import Message from '../../src/message';

describe('truncateMessages', () => {
  it('truncates the largest user message correctly', () => {
    const messages: Message[] = [
      { role: 'system', content: 'Short system message' },
      { role: 'user', content: 'A'.repeat(1000) },
      { role: 'assistant', content: 'Short response' }
    ];

    const result = truncateMessages(messages, 500, 400);

    expect(result).toBeDefined();
    expect(result?.length).toBe(3);
    expect(result?.[1].content.length).toBeLessThan(1000);
    expect(result?.[0].content).toBe(messages[0].content);
    expect(result?.[2].content).toBe(messages[2].content);
  });

  it('returns undefined when truncation is impossible', () => {
    const messages: Message[] = [
      { role: 'system', content: 'A'.repeat(100) },
      { role: 'user', content: 'B'.repeat(100) },
      { role: 'assistant', content: 'C'.repeat(100) }
    ];

    // Setting a very low max tokens to force impossible truncation
    const result = truncateMessages(messages, 500, 50);

    expect(result).toBeUndefined();
  });

  it('truncates correctly with multiple same-length messages', () => {
    const messages: Message[] = [
      { role: 'system', content: 'A'.repeat(500) },
      { role: 'user', content: 'B'.repeat(500) },
      { role: 'assistant', content: 'C'.repeat(500) }
    ];

    const result = truncateMessages(messages, 600, 500);

    expect(result).toBeDefined();
    expect(result?.length).toBe(3);
    // Should truncate the user message
    expect(result?.[1].content.length).toBeLessThan(500);
    expect(result?.[0].content).toBe(messages[0].content);
    expect(result?.[2].content).toBe(messages[2].content);
  });

  it('throws assertion error when promptTokens <= maxTokens', () => {
    const messages: Message[] = [
      { role: 'system', content: 'Test message' }
    ];

    expect(() => truncateMessages(messages, 100, 100)).toThrow('promptTokens must be greater than maxTokens');
    expect(() => truncateMessages(messages, 90, 100)).toThrow('promptTokens must be greater than maxTokens');
  });
});