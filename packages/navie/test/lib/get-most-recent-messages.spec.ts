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

    for (let i = 0; i < messages.length - 1; i++) {
      const events = getMostRecentMessages(messages, i);
      expect(events.length).toBe(i);
      for (let eventIndex = 0; eventIndex < events.length; eventIndex++) {
        const event = events[eventIndex];
        const message = messages[messages.length - 1 - i + eventIndex];
        expect(event.type).toEqual('prompt');
        expect(event.name).toEqual('historicalMessage');
        expect(event.role).toEqual(message.role);
        expect(event.content).toEqual(message.content);
      }
    }
  });

  it('does not return the most recent user message', () => {
    const messages: Message[] = [
      { role: 'user', content: "Let's count. I'll start. 1." },
      { role: 'assistant', content: '2' },
      { role: 'user', content: '3' },
    ];
    const events = getMostRecentMessages(messages, 1);
    expect(events.length).toBe(1);
    expect(events[0].role).toBe('assistant');
    expect(events[0].content).toBe('2');
  });

  it('fixes up the system role', () => {
    /*
      DB: I'm still seeing `system` messages in the chat history, despite efforts elsewhere
      to remove them.
    */
    const messages: Message[] = [
      { role: 'system', content: 'My name is bot.' },
      { role: 'user', content: 'Who asked?' },
    ];
    const events = getMostRecentMessages(messages, 1);
    expect(events.length).toBe(1);
    expect(events[0].role).toBe('assistant');
    expect(events[0].content).toBe('My name is bot.');
  });
});
