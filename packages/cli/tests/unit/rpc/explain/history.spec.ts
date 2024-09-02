import { mkdtempSync, rmSync } from 'fs';
import History from '../../../../src/rpc/explain/navie/history';
import { join } from 'path';
import { tmpdir } from 'os';
import { readdir, readFile, readlink, rm } from 'fs/promises';
import configuration from '../../../../src/rpc/configuration';
import { exists, verbose } from '../../../../src/utils';

describe(History, () => {
  const oldFixtureDir = join(__dirname, '..', '..', 'fixtures', 'history', 'oldFormat');
  let tempDir: string;

  const uuid1 = '9af0b3b0-4b3b-4b3b-4b3b-4b3b4b3b4b3b';
  const uuid2 = '9af0b3b0-4b3b-4b3b-4b3b-4b3b4b3b4b3c';

  beforeEach(() => (tempDir = mkdtempSync(join(tmpdir(), 'history-test-'))));
  if (!verbose()) afterEach(() => rmSync(tempDir, { recursive: true }));

  it('migrates old-style history to new-style history', async () => {
    const history = new History(tempDir);
    await History.migrate(oldFixtureDir, history, { cleanup: false });

    // List the threads in the new-style history directory
    const threads = await readdir(join(tempDir, 'threads'));
    expect(threads).toEqual([uuid1, uuid2]);

    // List the symlinks by date in the new history directory
    const dates = await readdir(join(tempDir, 'dates'));
    const todaysDate = new Date().toISOString().split('T')[0];
    expect(dates).toEqual([todaysDate]);

    const threadIds = await readdir(join(tempDir, 'dates', todaysDate));
    expect(threadIds).toEqual([uuid1, uuid2]);
  });

  it('ignores old-style history with no messages', async () => {
    const emptyOldFixtureDir = join(__dirname, '..', '..', 'fixtures', 'history', 'emptyOldFormat');
    const history = new History(tempDir);
    await History.migrate(emptyOldFixtureDir, history, { cleanup: false });

    expect(await exists(join(tempDir, 'threads'))).toBe(false);
    expect(await exists(join(tempDir, 'dates'))).toBe(false);
  });

  it('ignores old-style history when messages contain unrecognized roles', async () => {
    const oldFixtureDirWithUnrecognizedRoles = join(
      __dirname,
      '..',
      '..',
      'fixtures',
      'history',
      'oldFormatWithUnrecognizedRoles'
    );
    const history = new History(tempDir);
    await History.migrate(oldFixtureDirWithUnrecognizedRoles, history, { cleanup: false });

    expect(await exists(join(tempDir, 'threads'))).toBe(false);
    expect(await exists(join(tempDir, 'dates'))).toBe(false);
  });

  describe('load', () => {
    it('loads a thread from the new-style history', async () => {
      const history = new History(tempDir);

      await history.question(
        'thread-1',
        'question-1',
        'question 1',
        'code selection 1',
        'prompt 1'
      );
      await history.token('thread-1', 'question-1', 'answer-1', 'answer 1');

      await history.question(
        'thread-1',
        'question-2',
        'question 2',
        'code selection 2',
        'prompt 2'
      );
      await history.token('thread-1', 'question-2', 'answer-2', 'answer 2\n');
      await history.token('thread-1', 'question-2', 'answer-2', 'answer 3');

      const thread = await history.load('thread-1');
      const timestamps = thread.exchanges.map((e) => e.question.timestamp);
      const projectDirectories = configuration().projectDirectories;
      expect(thread.projectDirectories).toEqual(projectDirectories);
      expect(thread.exchanges).toEqual([
        {
          question: {
            role: 'user',
            timestamp: timestamps[0],
            messageId: 'question-1',
            content: 'question 1',
            prompt: 'prompt 1',
            codeSelection: 'code selection 1',
          },
          answer: {
            role: 'assistant',
            messageId: 'answer-1',
            content: 'answer 1',
          },
        },
        {
          question: {
            role: 'user',
            timestamp: timestamps[1],
            messageId: 'question-2',
            content: 'question 2',
            prompt: 'prompt 2',
            codeSelection: 'code selection 2',
          },
          answer: { role: 'assistant', messageId: 'answer-2', content: 'answer 2\nanswer 3' },
        },
      ]);
    });

    it('tests sequence of question() and token() calls and verifies filesystem output', async () => {
      const history = new History(tempDir);

      await history.question(
        'thread-1',
        'question-1',
        'question 1',
        'code selection 1',
        'prompt 1'
      );

      await history.token('thread-1', 'question-1', 'assistant-1', 'token 1\n');
      await history.token('thread-1', 'question-1', 'assistant-1', 'token 2\n');
      await history.token('thread-1', 'question-1', 'assistant-1', 'token 3');

      const messageDir = join(tempDir, 'threads', 'thread-1', 'messages', 'question-1');
      const sequenceDir = join(tempDir, 'threads', 'thread-1', 'sequence');
      const dateDir = join(tempDir, 'dates', new Date().toISOString().split('T')[0]);

      // Verify the existence of directories and files
      expect(await exists(messageDir)).toBe(true);
      expect(await exists(sequenceDir)).toBe(true);
      expect(await exists(dateDir)).toBe(true);

      // Verify the content of the files
      const questionFile = await readFile(join(messageDir, 'question.txt'), 'utf-8');
      expect(questionFile).toBe('question 1');

      const tokenFile = await readFile(join(messageDir, 'answer.md'), 'utf-8');
      expect(tokenFile).toBe('token 1\ntoken 2\ntoken 3');

      // Verify the symlinks
      const sequenceFiles = await readdir(sequenceDir);
      const sequenceFileNames = sequenceFiles.map((f) => f.split('.')[1]).sort();
      expect(sequenceFileNames).toEqual([
        'answer',
        'assistantMessageId',
        'codeSelection',
        'prompt',
        'question',
      ]);
      for (const sequenceFile of sequenceFiles) {
        const symlinkTarget = await readlink(join(sequenceDir, sequenceFile));
        expect(symlinkTarget).toContain('question-1');
      }
    });
  });
});
