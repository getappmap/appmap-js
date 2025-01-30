import { NavieRpc } from '@appland/rpc';
import ThreadService from '../../../../../../src/rpc/navie/services/threadService';
import {
  navieThreadPinItemHandler,
  navieThreadUnpinItemHandler,
} from '../../../../../../src/rpc/navie/thread/handlers/pinItem';

describe('pin item handlers', () => {
  let threadService: ThreadService;
  let mockThread: {
    pinItem: jest.Mock;
    unpinItem: jest.Mock;
  };

  beforeEach(() => {
    mockThread = {
      pinItem: jest.fn(),
      unpinItem: jest.fn(),
    };
    threadService = {
      getThread: jest.fn().mockResolvedValue(mockThread),
    } as unknown as ThreadService;
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  describe(NavieRpc.V1.Thread.PinItem.Method, () => {
    it('pins an item', () => {
      const threadId = 'example-thread-id';
      const pinnedItem = { uri: 'file://test' };
      const { handler } = navieThreadPinItemHandler(threadService);
      handler({
        threadId,
        pinnedItem,
      });
      expect(threadService.getThread).toHaveBeenCalledWith(threadId);
      expect(mockThread.pinItem).toHaveBeenCalledWith(pinnedItem);
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  describe(NavieRpc.V1.Thread.UnpinItem.Method, () => {
    it('unpins an item', () => {
      const threadId = 'example-thread-id';
      const pinnedItem = { uri: 'file://test' };
      const { handler } = navieThreadUnpinItemHandler(threadService);
      handler({
        threadId,
        pinnedItem,
      });
      expect(threadService.getThread).toHaveBeenCalledWith(threadId);
      expect(mockThread.unpinItem).toHaveBeenCalledWith(pinnedItem);
    });
  });
});
