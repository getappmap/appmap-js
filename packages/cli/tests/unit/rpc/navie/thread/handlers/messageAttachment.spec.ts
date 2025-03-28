import { NavieRpc } from '@appland/rpc';
import ThreadService from '../../../../../../src/rpc/navie/services/threadService';
import {
  navieThreadAddMessageAttachmentHandler,
  navieThreadRemoveMessageAttachmentHandler,
} from '../../../../../../src/rpc/navie/thread/handlers/messageAttachment';

describe('message attachment handlers', () => {
  let threadService: ThreadService;
  let mockThread: {
    addMessageAttachment: jest.Mock;
    removeMessageAttachment: jest.Mock;
  };

  beforeEach(() => {
    mockThread = {
      addMessageAttachment: jest.fn(),
      removeMessageAttachment: jest.fn(),
    };
    threadService = {
      getThread: jest.fn().mockResolvedValue(mockThread),
    } as unknown as ThreadService;
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  describe(NavieRpc.V1.Thread.AddMessageAttachment.Method, () => {
    it('adds a message attachment', () => {
      const threadId = 'example-thread-id';
      const uri = 'file://test.md';
      const { handler } = navieThreadAddMessageAttachmentHandler(threadService);
      handler({
        threadId,
        uri,
      });
      expect(threadService.getThread).toHaveBeenCalledWith(threadId);
      expect(mockThread.addMessageAttachment).toHaveBeenCalledWith(uri);
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  describe(NavieRpc.V1.Thread.RemoveMessageAttachment.Method, () => {
    it('removes a message attachment', () => {
      const threadId = 'example-thread-id';
      const uri = 'file://test.md';
      const { handler } = navieThreadRemoveMessageAttachmentHandler(threadService);
      handler({
        threadId,
        uri,
      });
      expect(threadService.getThread).toHaveBeenCalledWith(threadId);
      expect(mockThread.removeMessageAttachment).toHaveBeenCalledWith(uri);
    });
  });
});
