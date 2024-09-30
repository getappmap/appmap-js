import MessageTokenReducerService from '../../../src/services/message-token-reducer-service';
import Message from '../../../src/message';

const countCharacters = (messages: Message[]) =>
  messages.reduce((acc, { content }) => acc + content.length, 0);

const repeatCharacters = (str: string, numChars: number) => {
  const repeats = Math.ceil(numChars / str.length);
  const repeatedStr = str.repeat(repeats);
  return repeatedStr.slice(0, numChars);
};

describe('MessageTokenReducerService', () => {
  let messages: Message[];
  let service: MessageTokenReducerService;

  beforeEach(() => {
    messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Greetings! How can I assist you today?' },
      { role: 'user', content: 'Let me know about the weather.' },
    ];
    service = new MessageTokenReducerService();
  });

  describe('OpenAI', () => {
    describe('with an error', () => {
      it('reduces tokens as expected', async () => {
        const numCharacters = countCharacters(messages);
        const apiError = {
          message: `This model's maximum context length is ${
            numCharacters - ` weather.`.length
          } tokens. However, your messages resulted in ${numCharacters} tokens. Please reduce the length of the messages.`,
        };
        const result = await service.reduceMessageTokens(messages, 'gpt-4o', apiError);
        expect(result).toStrictEqual([
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Greetings! How can I assist you today?' },
          { role: 'user', content: 'Let me know about the' },
        ]);
      });
    });
  });

  it('returns the original messages if the token limit is not exceeded', async () => {
    const result = await service.reduceMessageTokens(messages, 'gpt-4o');
    expect(result).toStrictEqual(messages);
  });

  it('trims the messages if the token limit is exceeded', async () => {
    const maxTokens = 8_192;
    const charactersPerToken = 3;

    // The last user message will now overflow the token limit
    messages[messages.length - 1].content = 'abc'.repeat(maxTokens);

    const contentLength = messages.slice(0, 3).reduce((acc, m) => acc + m.content.length, 0);
    const result = await service.reduceMessageTokens(messages, 'gpt-4');
    const newContentLength = countCharacters(result);
    expect(newContentLength).toBe(maxTokens * 3);
    expect(result).toStrictEqual([
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Greetings! How can I assist you today?' },
      {
        role: 'user',
        content: repeatCharacters('abc', maxTokens * charactersPerToken - contentLength),
      },
    ]);
  });

  describe('Claude', () => {
    describe('with an error', () => {
      it('reduces tokens as expected', async () => {
        const numCharacters = countCharacters(messages);
        const apiError = {
          message: `prompt is too long: ${numCharacters} tokens > ${
            numCharacters - ` weather.`.length
          } maximum`,
        };
        const result = await service.reduceMessageTokens(
          messages,
          'claude-3-5-sonnet-20240620',
          apiError
        );
        expect(result).toStrictEqual([
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Greetings! How can I assist you today?' },
          { role: 'user', content: 'Let me know about the' },
        ]);
      });
    });
  });
});
