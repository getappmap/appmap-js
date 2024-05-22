import { ExplainRpc } from '@appland/rpc';
import type { RpcHandler } from '../../../../src/rpc/rpc';
import { explainHandler } from '../../../../src/rpc/explain/explain';
import EventEmitter from 'events';
import { INavieProvider } from '../../../../src/rpc/explain/navie/inavie';

type NavieMock = EventEmitter & {
  on: jest.Mock<() => void, [event: string, listener: (...args: unknown[]) => void]>;
  ask: jest.Mock<Promise<void>, [threadId: string, question: string, code?: string]>;
};

describe('explainHandler', () => {
  let handler: RpcHandler<ExplainRpc.ExplainOptions, ExplainRpc.ExplainResponse>['handler'];
  let navieProvider: INavieProvider;
  let navie: NavieMock;

  beforeEach(() => {
    navie = new EventEmitter() as NavieMock;
    navie.ask = jest
      .fn<Promise<void>, [threadId: string, question: string, code?: string]>()
      .mockResolvedValue(undefined);
    jest.spyOn(navie, 'on');
    jest.spyOn(navie, 'ask');
    navieProvider = jest.fn().mockReturnValue(navie) as INavieProvider;
    handler = explainHandler(navieProvider, undefined).handler;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // userMessageId and threadId are emit by Navie via the ack event
  async function explain(
    options: ExplainRpc.ExplainOptions & { userMessageId?: string; threadId?: string }
  ) {
    const res = handler(options);

    // Wait a tick for the event listeners to bind
    await new Promise((resolve) => setImmediate(resolve));
    expect(navie.on).toHaveBeenCalled();

    navie.emit('ack', options.userMessageId ?? 'user-message-id', options.threadId ?? 'thread-id');

    return res;
  }

  describe('codeSelection', () => {
    it('caches the code selection by threadId', async () => {
      const threadId = 'the-thread-id';
      const codeSelection = 'int main() { return 0; }';
      const questions = ['how do i??', 'but i cant??'];
      await explain({ question: questions[0], codeSelection, threadId });
      expect(navie.ask).toHaveBeenCalledWith(threadId, questions[0], codeSelection);

      // The same threadId should be used for the next call
      // Note that codeSelection is not given
      await explain({ question: questions[1], threadId });
      expect(navie.ask).toHaveBeenCalledWith(threadId, questions[1], codeSelection);
    });

    it('does not cache the code selection by threadId if codeSelection is not given', async () => {
      const threadId = 'the-other-thread-id';
      for (const question of ['???', 'now what?']) {
        await explain({ question: question, threadId });
        expect(navie.ask).toHaveBeenCalledWith(threadId, question, undefined);
      }
    });
  });
});
