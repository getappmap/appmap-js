import { container } from 'tsyringe';
import NavieService from '../../../../../src/rpc/navie/services/navieService';
import { ThreadIndexService } from '../../../../../src/rpc/navie/services/threadIndexService';
import ThreadService from '../../../../../src/rpc/navie/services/threadService';
import { Thread } from '../../../../../src/rpc/navie/thread';
import { ConversationThread } from '@appland/client';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

describe('ThreadService', () => {
  let threadService: ThreadService;
  let navieService: NavieService;
  let threadIndexService: ThreadIndexService;
  const threadId = 'example-thread-id';

  beforeEach(() => {
    container.reset();
    container;

    threadIndexService = {
      delete: jest.fn(),
    } as unknown as ThreadIndexService;

    navieService = {} as unknown as NavieService;

    container.registerInstance(ThreadIndexService, threadIndexService);
    container.registerInstance(NavieService, navieService);
    threadService = container.resolve(ThreadService);
  });

  afterEach(() => rm(Thread.getHistoryFilePath(threadId), { force: true, recursive: true }));

  describe('getThread', () => {
    it('retrieves a thread from memory', async () => {
      threadService.registerThread({ id: threadId } as unknown as ConversationThread);
      await expect(threadService.getThread(threadId)).resolves.toBeInstanceOf(Thread);
    });

    it('loads a thread from disk', async () => {
      const threadPath = Thread.getHistoryFilePath(threadId);
      await mkdir(dirname(threadPath), { recursive: true });
      await writeFile(
        threadPath,
        JSON.stringify({ type: 'thread-init', conversationThread: { id: threadId } })
      );
      await expect(threadService.getThread(threadId)).resolves.toBeInstanceOf(Thread);
    });

    it('raises an error if no thread-init event is found', async () => {
      const threadPath = Thread.getHistoryFilePath(threadId);
      await writeFile(threadPath, JSON.stringify({}));
      await expect(threadService.getThread(threadId)).rejects.toThrow(
        'Thread init event not found'
      );
    });

    it('raises an error if the thread is not found', async () => {
      const result = threadService.getThread(threadId);
      await Promise.all([
        expect(result).rejects.toBeInstanceOf(Error),
        expect(result).rejects.toThrow('Failed to load history file'),
        expect(result).rejects.toThrow('ENOENT'),
      ]);
    });
  });

  describe('registerThread', () => {
    it('fails if the thread is already registered', () => {
      const conversationThread = { id: threadId } as unknown as ConversationThread;
      threadService.registerThread(conversationThread);
      expect(() => threadService.registerThread(conversationThread)).toThrow(
        `Thread ${conversationThread.id} is already registered`
      );
    });
  });
});
