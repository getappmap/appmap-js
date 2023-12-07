import Search from '@/lib/Search';
import { waitFor } from './waitFor';

type Invocation = {
  method: string;
  params: any;
};

describe('Search', () => {
  afterEach(() => jest.restoreAllMocks());

  describe('ask', () => {
    let client: any;
    const question = 'What is the meaning of life?';
    const invocations: Invocation[] = [];

    beforeEach(() => {
      client = jest.fn();
      client.request = jest.fn((method: string, params: any, callback: any) => {
        invocations.push({ method, params });
        callback(null, null, 'explanation');
      });
    });

    it('assigns new threadId', async () => {
      const search = new Search(client);

      const ask = search.ask();
      const receivedParams: any = {};
      let complete = false;

      ask.on('ack', (userMessageId: string, threadId: string) => {
        receivedParams.userMessageId = userMessageId;
        receivedParams.threadId = threadId;
      });
      ask.on('token', (token: string, messageId: string) => {
        receivedParams.token = token;
        receivedParams.messageId = messageId;
      });
      ask.on('error', (err: Error) => {
        receivedParams.err = err;
      });
      ask.on('complete', () => {
        expect(receivedParams.userMessageId).toBeTruthy();
        expect(receivedParams.threadId).toBeTruthy();
        expect(receivedParams.token).toBeTruthy();
        expect(receivedParams.messageId).toBeTruthy();
        expect(receivedParams.err).toBeFalsy();
        complete = true;
      });

      ask.ask(question);

      await waitFor(async () => expect(complete).toBeTruthy());

      expect(invocations).toHaveLength(1);
      expect(invocations[0].method).toEqual('ask');
      expect(invocations[0].params).toEqual({
        question,
        threadId: receivedParams.threadId,
      });
    });
    it('retains threadId', async () => {
      const existingThreadId = 'the-thread-id';
      const search = new Search(client);
      const question = 'What is the meaning of life?';

      const ask = search.ask();
      let complete = false;

      ask.on('ack', (_userMessageId: string, threadId: string) => {
        expect(threadId).toEqual(existingThreadId);
      });
      ask.on('complete', () => {
        complete = true;
      });

      ask.ask(question, existingThreadId);

      await waitFor(async () => expect(complete).toBeTruthy());
    });
  });
});
