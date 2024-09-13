import type Message from '../../src/message';
import getMostRecentMessages from '../../src/lib/get-most-recent-messages';

describe('getMostRecentMessages', () => {
  it('returns the expected output', () => {
    const messages: Message[] = [
      { role: 'user', content: 'What is your name?' },
      { role: 'assistant', content: 'I am bot.' },
      { role: 'user', content: 'How are you?' },
      { role: 'assistant', content: 'I am fine.' },
      { role: 'user', content: 'That is nice to hear.' },
      { role: 'assistant', content: 'Thank you.' },
      { role: 'user', content: 'What can you do?' },
    ];

    for (let i = 0; i < messages.length; i++) {
      const events = getMostRecentMessages(messages, i);
      if (i === 0) {
        expect(events.length).toBe(0);
        continue;
      }
      expect(events.map(({ role, content }) => ({ role, content }))).toStrictEqual(
        messages.slice(-i - (1 - (i % 2)))
      );
    }
  });

  it('always starts with a user message (adding messages as necessary)', () => {
    const messages: Message[] = [
      { role: 'user', content: "Let's count. I'll start. 1." },
      { role: 'assistant', content: '2' },
      { role: 'user', content: '3' },
    ];
    const events = getMostRecentMessages(messages, 2);
    expect(events.map((m) => m.role)).toStrictEqual(['user', 'assistant', 'user']);
  });

  it('always starts with a user message (removing messages as necessary)', () => {
    const messages: Message[] = [
      { role: 'assistant', content: "Let's count. I'll start. 1." },
      { role: 'assistant', content: '2' },
      { role: 'user', content: '3' },
    ];
    const events = getMostRecentMessages(messages, 2);
    expect(events.map((m) => m.role)).toStrictEqual(['user']);
  });

  it('fixes up the system role', () => {
    /*
      DB: I'm still seeing `system` messages in the chat history, despite efforts elsewhere
      to remove them.
    */
    const messages: Message[] = [
      { role: 'user', content: 'Hello.' },
      { role: 'system', content: 'My name is bot.' },
      { role: 'user', content: 'Who asked?' },
    ];
    const events = getMostRecentMessages(messages, 2);
    expect(events.length).toBe(3);
    expect(events[1].role).toBe('assistant');
    expect(events[1].content).toBe('My name is bot.');
  });

  it('discards non-conversational messages', () => {
    const messages: Message[] = [
      { role: 'user', content: 'Hello.' },
      { role: 'assistant', content: 'Hi.' },
      { role: 'user', content: '@suggest /nohelp /nocontext' },
      {
        role: 'assistant',
        content:
          '[{"label":"Ask about the codebase","prompt":"What do you want to know about this codebase?"}]',
      },
      { role: 'user', content: 'What is the meaning of life?' },
      { role: 'assistant', content: '42' },
    ];

    const events = getMostRecentMessages(messages, messages.length);
    expect(events.map(({ role, content }) => ({ role, content }))).toStrictEqual([
      ...messages.slice(0, 2),
      ...messages.slice(4),
    ]);
  });
});
