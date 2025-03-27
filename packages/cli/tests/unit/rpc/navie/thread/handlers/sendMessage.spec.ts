import { NavieRpc } from '@appland/rpc';
import ThreadService from '../../../../../../src/rpc/navie/services/threadService';
import { navieThreadSendMessageHandler } from '../../../../../../src/rpc/navie/thread/handlers/sendMessage';

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
describe(NavieRpc.V1.Thread.SendMessage.Method, () => {
  let threadService: ThreadService;
  let mockThread: {
    sendMessage: jest.Mock;
  };

  beforeEach(() => {
    mockThread = {
      sendMessage: jest.fn(),
    };
    threadService = {
      getThread: jest.fn().mockResolvedValue(mockThread),
    } as unknown as ThreadService;
  });

  it('propagates parameters as expected', () => {
    const threadId = 'example-thread-id';
    const content = 'test content';
    const userContext: NavieRpc.V1.Thread.ContextItem[] = [
      { uri: 'handle://00000000-0000-0000-0000-000000000000', content: 'hello world' },
      { uri: 'file://test' },
    ];
    const { handler } = navieThreadSendMessageHandler(threadService);
    handler({
      threadId,
      content,
      userContext,
    });
    expect(threadService.getThread).toHaveBeenCalledWith(threadId);
    expect(mockThread.sendMessage).toHaveBeenCalledWith(content, userContext);
  });
});
