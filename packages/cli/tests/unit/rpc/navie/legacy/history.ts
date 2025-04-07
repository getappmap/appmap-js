import { mkdtemp, readFile, writeFile } from 'fs/promises';
import LegacyHistory from '../../../../../src/rpc/navie/legacy/history';
import LegacyThread from '../../../../../src/rpc/navie/legacy/thread';
import { tmpdir } from 'os';
import { join } from 'path';

// This class has full public access to members of LegacyHistory.
type LegacyHistoryTest = Omit<
  LegacyHistory,
  'getOrCreateThread' | 'writeThread' | 'threads' | 'debounceTimers'
> & {
  debounceTimers: typeof LegacyHistory.prototype['debounceTimers'];
  getOrCreateThread: typeof LegacyHistory.prototype['getOrCreateThread'];
  writeThread: typeof LegacyHistory.prototype['writeThread'];
};

const HistoryStatic = LegacyHistory as unknown as {
  DEBOUNCE_TIME: number;
  THREADS: Map<string, LegacyThread>;
};

jest.useFakeTimers();
describe('LegacyHistory', () => {
  let history: LegacyHistoryTest;
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'appmap-test-'));
    history = new LegacyHistory(tmpDir) as unknown as LegacyHistoryTest;
    HistoryStatic.THREADS = new Map();
  });

  // Wait for the event loop to advance by the specified number of ticks.
  const advanceTicks = async (ticks: number) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    for (let i = 0; i < ticks; i++) await new Promise(jest.requireActual('timers').setImmediate);
  };

  describe('token', () => {
    it('appends a token to the thread', () => {
      jest.spyOn(history, 'writeThread').mockReturnValue(undefined);

      const threadId = '123';
      const userMessageId = '456';
      const assistantMessageId = '789';
      const tokens = 'hello world !'.split(' ');

      // Initialize the exchange
      history.question(threadId, userMessageId, '', undefined, undefined);

      for (const token of tokens) {
        history.token(threadId, userMessageId, assistantMessageId, token);
      }

      const thread = HistoryStatic.THREADS.get(threadId);
      const [exchange] = thread?.exchanges ?? [];
      expect(thread?.exchanges.length).toBe(1);
      expect(exchange.answer).toStrictEqual({
        messageId: assistantMessageId,
        role: 'assistant',
        content: 'helloworld!',
      });
    });

    it('stages the thread for writing to disk', () => {
      const threadId = '123';
      const userMessageId = '456';
      const mockWriteThread = jest.spyOn(history, 'writeThread');

      history.question(threadId, userMessageId, '', undefined, undefined);
      history.token(threadId, userMessageId, '789', 'hello world');

      expect(mockWriteThread).toHaveBeenCalledWith(threadId);
    });

    it('throws an error if the user message is not found', () => {
      expect(() => history.token('123', '456', '789', 'hello world')).toThrow(
        'no exchange found for user message 456'
      );
    });
  });

  describe('question', () => {
    it('should add a question to the thread', () => {
      const threadId = '123';
      const thread = history.getOrCreateThread(threadId);
      expect(thread.threadId).toBe(threadId);

      history.question(threadId, '456', 'hello world', 'code selection', 'prompt');

      const [exchange] = thread.exchanges;
      expect(thread.exchanges.length).toBe(1);
      expect(exchange.question).toStrictEqual({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        timestamp: expect.any(Number),
        messageId: '456',
        content: 'hello world',
        role: 'user',
        codeSelection: JSON.stringify('code selection'),
        prompt: 'prompt',
      });
    });

    it('stages the thread for writing to disk', () => {
      const threadId = '123';
      const mockWriteThread = jest.spyOn(history, 'writeThread');

      history.question(threadId, '456', 'hello world', 'code selection', 'prompt');

      expect(mockWriteThread).toHaveBeenCalledWith(threadId);
    });
  });

  describe('load', () => {
    it('should load a thread from disk', async () => {
      const threadId = '123';
      const threadData = {
        timestamp: 0,
        projectDirectories: ['/home/user'],
        exchanges: [
          {
            question: {
              timestamp: 1,
              messageId: '456',
              content: 'hello world',
              role: 'user',
              codeSelection: undefined,
              prompt: undefined,
            },
          },
        ],
      };
      const serialized = JSON.stringify(threadData);
      await writeFile(join(tmpDir, `${threadId}.json`), serialized);

      const thread = await history.load(threadId);
      expect(JSON.stringify(thread.asJSON())).toStrictEqual(serialized);
    });

    it('retrieves a thread from memory if it is already loaded', async () => {
      const threadId = '123';
      HistoryStatic.THREADS.set(threadId, new LegacyThread(threadId, 0, ['/home/user']));

      const thread = await history.load(threadId);
      expect(thread.threadId).toBe(threadId);
    });
  });

  describe('writeThread', () => {
    it('should write the thread to disk after a delay', async () => {
      const threadId = '123';
      const thread = history.getOrCreateThread(threadId);
      expect(thread.threadId).toBe(threadId);

      history.writeThread(threadId);

      const serialized = JSON.stringify(thread.asJSON());
      const filePath = join(tmpDir, `${thread.threadId}.json`);
      await expect(readFile(filePath, 'utf-8')).rejects.toThrow('ENOENT');
      jest.advanceTimersByTime(HistoryStatic.DEBOUNCE_TIME);
      await advanceTicks(3);
      await expect(readFile(filePath, 'utf-8')).resolves.toStrictEqual(serialized);
    });
  });

  describe('getOrCreateThread', () => {
    it('should create a thread if it does not exist', () => {
      const threadId = '123';
      const thread = history.getOrCreateThread(threadId);
      expect(thread.threadId).toBe(threadId);
      expect(HistoryStatic.THREADS.get(threadId)).toBe(thread);
    });

    it('should return the same thread if it already exists', () => {
      const threadId = '123';
      const thread = history.getOrCreateThread(threadId);
      expect(thread.threadId).toBe(threadId);

      const thread2 = history.getOrCreateThread(threadId);
      expect(thread2).toStrictEqual(thread);
    });
  });
});
