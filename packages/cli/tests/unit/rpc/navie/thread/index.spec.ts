/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ConversationThread } from '@appland/client';
import { Thread } from '../../../../../src/rpc/navie/thread';
import NavieService from '../../../../../src/rpc/navie/services/navieService';
import { container } from 'tsyringe';
import { getSuggestions } from '../../../../../src/rpc/navie/suggest';
import { EventEmitter } from 'stream';
import INavie, { INavieProvider } from '../../../../../src/rpc/explain/navie/inavie';
import { homedir, tmpdir } from 'os';
import { join } from 'path';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { exists } from '../../../../../src/utils';
import {
  NavieAddMessageAttachmentEvent,
  NavieEvent,
  NavieMessageEvent,
  NavieTokenMetadataEvent,
} from '../../../../../src/rpc/navie/thread/events';
import { ThreadIndexService } from '../../../../../src/rpc/navie/services/threadIndexService';
import { randomUUID } from 'crypto';
import handleReview from '../../../../../src/rpc/explain/review';
import { NavieRpc, URI } from '@appland/rpc';

const exampleSuggestion = {
  command: '@test',
  prompt: 'this is a test stub',
  label: 'stubbed suggestion',
  overallScore: 0.5,
};
jest.mock('../../../../../src/rpc/navie/suggest', () => ({
  getSuggestions: jest.fn().mockImplementation(() => Promise.resolve([exampleSuggestion])),
}));

jest.mock('../../../../../src/rpc/explain/review', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({ applied: false }),
}));

const mockGetSuggestions = jest.mocked(getSuggestions);
const mockHandleReview = jest.mocked(handleReview);

// Casting a Thread to a ThreadPrivate allows us to access private members
// in test without exposing them to the public API.
type ThreadPrivate = Omit<Thread, 'log' | 'listeners' | 'logEvent'> & {
  log: typeof Thread.prototype['log'];
  listeners: typeof Thread.prototype['listeners'];
  logEvent: typeof Thread.prototype['logEvent'];
  lastEventWritten: typeof Thread.prototype['lastEventWritten'];
  flush: typeof Thread.prototype['flush'];
  onToken: typeof Thread.prototype['onToken'];
};

describe('Thread', () => {
  let thread: ThreadPrivate;
  let conversationThread: ConversationThread;
  let mockNavie: INavie;
  let mockNavieProvider: INavieProvider;
  let navieEventEmitter: EventEmitter;

  beforeEach(() => {
    jest.clearAllMocks();
    navieEventEmitter = new EventEmitter();
    mockNavie = {
      providerName: 'test',
      setOption: jest.fn(),
      ask: jest.fn().mockResolvedValue(undefined),
      on: jest.fn().mockImplementation((event: string, listener: (...args: unknown[]) => void) => {
        navieEventEmitter.on(event, listener);
        return mockNavie;
      }),
      terminate: jest.fn(),
    };
    mockNavieProvider = () => mockNavie;
    NavieService.bindNavieProvider(mockNavieProvider);
    const navieService = container.resolve(NavieService);

    conversationThread = { id: 'example-thread-id' } as unknown as ConversationThread;
    thread = new Thread(conversationThread, navieService) as unknown as ThreadPrivate;
  });

  describe('initialize', () => {
    it('writes a thread-init event containing the conversation thread', () => {
      thread.initialize();

      expect(thread.conversationThread).toBe(conversationThread);
      expect(thread.log).toEqual([
        {
          type: 'thread-init',
          time: expect.any(Number),
          conversationThread,
        },
      ]);
    });
  });

  describe('logEvent', () => {
    it('appends a timestamp to the event', () => {
      thread.logEvent({ type: 'message', role: 'assistant', content: 'test', messageId: '1' });
      expect(thread.log[0].time).toBeLessThanOrEqual(Date.now().valueOf());
    });

    it('emits an `event` event', () => {
      const listener = jest.fn();
      thread.on('event', 'test-client', listener);
      thread.logEvent({ type: 'message', role: 'assistant', content: 'test', messageId: '1' });
      expect(listener).toHaveBeenCalledWith({
        type: 'message',
        role: 'assistant',
        content: 'test',
        messageId: '1',
        time: expect.any(Number),
      });
    });
  });

  describe('emitSuggestions', () => {
    it('emits suggestions upon completing an assistant message', async () => {
      thread.flush = jest.fn().mockResolvedValue(undefined);
      const result = thread.sendMessage('test message');

      // Some async calls happen before event listeners are bound
      setImmediate(() => navieEventEmitter.emit('ack', 'user-message-id'));
      await expect(result).resolves.toBeUndefined();

      navieEventEmitter.emit('token', 'hello world', 'assistant-message-id');
      navieEventEmitter.emit('complete');
      expect(thread.flush).toHaveBeenCalled();

      // Flush is async, so we need to wait for it to complete
      await new Promise((resolve) => setImmediate(resolve));
      expect(mockGetSuggestions).toHaveBeenCalledWith(
        mockNavieProvider,
        thread.conversationThread.id
      );
      expect(thread.log[thread.log.length - 1]).toEqual({
        type: 'prompt-suggestions',
        suggestions: [exampleSuggestion],
        time: expect.any(Number),
        messageId: 'assistant-message-id',
      });
    });
  });

  describe('getHistoryFilePath', () => {
    it('returns the expected path', () => {
      expect(Thread.getHistoryFilePath('example-thread-id')).toBe(
        join(homedir(), '.appmap', 'navie', 'history', 'example-thread-id.navie.jsonl')
      );
    });
  });

  describe('removeAllListeners', () => {
    it('unbinds all listeners for a given client identifier', () => {
      const clientId = 'test-client';
      const numListeners = 5;
      const listeners = Array.from({ length: numListeners }, () => jest.fn());
      listeners.forEach((listener) => thread.on('event', clientId, listener));

      thread.removeAllListeners(clientId);
      expect(thread.listeners.get(clientId)).toBeUndefined();

      thread.logEvent({ type: 'message', role: 'assistant', content: 'test', messageId: '1' });
      listeners.forEach((listener) => expect(listener).not.toHaveBeenCalled());
    });
  });

  describe('flush', () => {
    const staticThread = Thread as unknown as { HISTORY_DIRECTORY: string };
    let expectedPath: string;
    let originalHistoryPath: string;
    let threadIndexService: ThreadIndexService;
    let tmpDir: string;

    beforeEach(async () => {
      container.reset();
      tmpDir = await mkdtemp(join(tmpdir(), 'appmap-test-'));
      originalHistoryPath = staticThread.HISTORY_DIRECTORY;
      staticThread.HISTORY_DIRECTORY = tmpDir;
      expectedPath = Thread.getHistoryFilePath(thread.conversationThread.id);
      threadIndexService = {
        index: jest.fn(),
      } as unknown as ThreadIndexService;
      container.register(ThreadIndexService, { useValue: threadIndexService });
    });

    afterEach(async () => {
      container.reset();
      staticThread.HISTORY_DIRECTORY = originalHistoryPath;
      await rm(tmpDir, { recursive: true, force: true });
    });

    it('does nothing if the event log is empty', async () => {
      await thread.flush();
      await expect(exists(expectedPath)).resolves.toBe(false);
    });

    it('does nothing if the event log is unchanged since the last flush', async () => {
      thread.logEvent({ type: 'message', role: 'assistant', content: 'test', messageId: '1' });
      thread.lastEventWritten = thread.log.length;

      await thread.flush();
      await expect(exists(expectedPath)).resolves.toBe(false);
    });

    it('writes the event log to disk', async () => {
      const messages: NavieEvent[] = Array.from({ length: 5 }, (i) => ({
        type: 'message',
        role: 'assistant',
        content: 'test',
        messageId: String(i),
      }));
      messages.forEach((m) => thread.logEvent(m));

      await thread.flush();

      const events = await readFile(expectedPath, { encoding: 'utf-8' })
        .then((data) => data.split('\n').filter(Boolean))
        .then((lines) => lines.map((line) => JSON.parse(line) as Record<string, unknown>));
      expect(events).toStrictEqual(messages.map((m) => ({ ...m, time: expect.any(Number) })));
    });

    it('creates directories if they do not exist', async () => {
      staticThread.HISTORY_DIRECTORY = join(tmpDir, 'does-not-exist', 'this-does-not-either');
      expectedPath = Thread.getHistoryFilePath(thread.conversationThread.id);

      // Write an event to the thread
      thread.initialize();

      await thread.flush();
      await expect(exists(expectedPath)).resolves.toBe(true);
    });

    it('updates the thread index with the last user message as the title', async () => {
      const content = 'example title';
      thread.initialize();
      thread.logEvent({ type: 'message', role: 'user', content, messageId: '1' });
      await thread.flush();
      expect(threadIndexService.index).toHaveBeenCalledWith(
        thread.conversationThread.id,
        expectedPath,
        content
      );
    });

    it('truncates the last user message if it is too long', async () => {
      const content = 'a'.repeat(1000);
      thread.initialize();
      thread.logEvent({ type: 'message', role: 'user', content, messageId: '1' });
      await thread.flush();
      expect(threadIndexService.index).toHaveBeenCalledWith(
        thread.conversationThread.id,
        expectedPath,
        'a'.repeat(100)
      );
    });

    it('does not raise an error if the thread index fails to update', async () => {
      await thread.initialize();
      threadIndexService.index = jest.fn().mockImplementation(() => {
        throw new Error('test error');
      });
      await expect(thread.flush()).resolves.toBeUndefined();
    });

    it('does not raise an error if the history file fails to write', async () => {
      await writeFile(expectedPath, '');
      await chmod(expectedPath, 0o400);
      await thread.initialize();
      await expect(thread.flush()).resolves.toBeUndefined();
      await expect(readFile(expectedPath, { encoding: 'utf-8' })).resolves.toBe('');
    });

    it('appends to an existing history file as expected', async () => {
      await thread.initialize();

      thread.logEvent({ type: 'message', role: 'assistant', content: 'test', messageId: '1' });
      await thread.flush();

      const events = await readFile(expectedPath, { encoding: 'utf-8' })
        .then((data) => data.split('\n').filter(Boolean))
        .then((lines) => lines.map((line) => JSON.parse(line) as Record<string, unknown>));
      expect(events).toStrictEqual([
        {
          type: 'thread-init',
          conversationThread: thread.conversationThread,
          time: expect.any(Number),
        },
        {
          type: 'message',
          role: 'assistant',
          content: 'test',
          messageId: '1',
          time: expect.any(Number),
        },
      ]);
    });
  });

  describe('pinItem', () => {
    it('emits a `pin-item` event', () => {
      const listener = jest.fn();
      const uri = URI.random().toString();
      const content = 'test-content';
      thread.on('event', 'test-client', listener);
      thread.pinItem(uri, content);
      expect(listener).toHaveBeenCalledWith({
        type: 'pin-item',
        uri,
        content,
        time: expect.any(Number),
      });
    });
  });

  describe('unpinItem', () => {
    it('emits an `unpin-item` event', () => {
      const listener = jest.fn();
      const uri = URI.random().toString();
      thread.on('event', 'test-client', listener);
      thread.unpinItem(uri);
      expect(listener).toHaveBeenCalledWith({
        type: 'unpin-item',
        uri,
        time: expect.any(Number),
      });
    });
  });

  describe('onToken', () => {
    it('emits tokens as `token` events', () => {
      const listener = jest.fn();
      thread.on('event', 'test-client', listener);
      thread.onToken('test token', 'test-message-id');
      expect(listener).toHaveBeenCalledWith({
        type: 'token',
        token: 'test token',
        messageId: 'test-message-id',
        time: expect.any(Number),
      });
    });

    it('strips file comment directives and emits them as token-metadata events', () => {
      const listener = jest.fn();
      thread.on('event', 'test-client', listener);
      thread.onToken(`<!-- file: test-file.md -->`, 'test-message-id');
      expect(listener).toHaveBeenCalledWith({
        type: 'token-metadata',
        codeBlockUri: expect.any(String),
        metadata: {
          location: 'test-file.md',
        },
        time: expect.any(Number),
      });
    });

    it('emits top level code block languages as token-metadata events', () => {
      const listener = jest.fn();
      thread.on('event', 'test-client', listener);
      thread.onToken(`\`\`\`ruby\n# test\n\`\`\``, 'test-message-id');
      expect(listener).toHaveBeenCalledWith({
        type: 'token-metadata',
        codeBlockUri: expect.any(String),
        metadata: {
          language: 'ruby',
        },
        time: expect.any(Number),
      });
    });

    it('does not emit nested code block languages as token-metadata events', () => {
      const listener = jest.fn();
      thread.on('event', 'test-client', listener);
      thread.onToken(
        ['````ruby', '```python', '# test', '```', '````'].join('\n'),
        'test-message-id'
      );
      expect(listener).toHaveBeenCalledWith({
        type: 'token-metadata',
        codeBlockUri: expect.any(String),
        metadata: {
          language: 'ruby',
        },
        time: expect.any(Number),
      });
      expect(listener).not.toHaveBeenCalledWith({
        type: 'token-metadata',
        codeBlockUri: expect.any(String),
        metadata: {
          language: 'python',
        },
        time: expect.any(Number),
      });
    });

    it('does not strip code fences from the token', () => {
      const listener = jest.fn();
      thread.on('event', 'test-client', listener);
      thread.onToken('```ruby\n# test\n```', 'test-message-id');
      expect(listener.mock.calls.flat()).toStrictEqual([
        {
          type: 'token',
          token: '```',
          messageId: 'test-message-id',
          time: expect.any(Number),
          codeBlockUri: expect.any(String),
        },
        {
          type: 'token-metadata',
          codeBlockUri: expect.any(String),
          metadata: {
            language: 'ruby',
          },
          time: expect.any(Number),
        },
        {
          type: 'token',
          token: 'ruby\n# test\n',
          messageId: 'test-message-id',
          time: expect.any(Number),
          codeBlockUri: expect.any(String),
        },
        {
          type: 'token',
          token: '```',
          messageId: 'test-message-id',
          time: expect.any(Number),
          codeBlockUri: expect.any(String),
        },
      ]);
    });

    it('strips file comment directives from the token stream', () => {
      const listener = jest.fn();
      thread.on('event', 'test-client', listener);
      thread.onToken(`<!-- file: test-file.md -->\n# test\n`, 'test-message-id');
      expect(listener.mock.calls.flat()).toStrictEqual([
        {
          type: 'token-metadata',
          codeBlockUri: expect.any(String),
          metadata: {
            location: 'test-file.md',
          },
          time: expect.any(Number),
        },
        {
          type: 'token',
          token: '# test\n',
          messageId: 'test-message-id',
          time: expect.any(Number),
          codeBlockUri: expect.any(String),
        },
      ]);
    });

    it('handles cases where the file directive is inside a code block', () => {
      const listener = jest.fn();
      thread.on('event', 'test-client', listener);
      thread.onToken(
        ['```ruby', '<!-- file: app/models/user.rb -->', '# test', '```'].join('\n'),
        'test-message-id'
      );

      const calls = listener.mock.calls.flat();
      // There should only be a single code block
      const codeBlockUri = (calls as NavieEvent[])
        .filter((e): e is NavieTokenMetadataEvent => e.type === 'token-metadata')
        .find((e) => e.codeBlockUri)?.codeBlockUri;

      expect(codeBlockUri).toBeDefined();
      expect(calls).toStrictEqual([
        {
          type: 'token',
          token: '```',
          messageId: 'test-message-id',
          time: expect.any(Number),
          codeBlockUri,
        },
        {
          type: 'token-metadata',
          metadata: {
            location: 'app/models/user.rb',
          },
          time: expect.any(Number),
          codeBlockUri,
        },
        {
          type: 'token-metadata',
          metadata: {
            language: 'ruby',
          },
          time: expect.any(Number),
          codeBlockUri,
        },
        {
          type: 'token',
          token: 'ruby\n# test\n',
          messageId: 'test-message-id',
          time: expect.any(Number),
          codeBlockUri,
        },
        {
          type: 'token',
          token: '```',
          messageId: 'test-message-id',
          time: expect.any(Number),
          codeBlockUri,
        },
      ]);
    });
  });

  describe('sendMessage', () => {
    it('has context mutated by `@review`', async () => {
      const message = '@review my code';
      const uri = URI.random().toString();
      const context: NavieRpc.V1.Thread.ContextItem[] = [{ uri, content: 'test' }];
      const result = thread.sendMessage(message, context);

      await new Promise((resolve) => setImmediate(resolve));
      setImmediate(() => navieEventEmitter.emit('ack', 'user-message-id'));

      await expect(result).resolves.toBeUndefined();
      expect(mockHandleReview).toHaveBeenCalledWith(message, [
        { content: 'test', type: 'code-snippet', location: uri },
      ]);
    });

    it('includes message attachments added since the last user message', async () => {
      const content = 'test-content';
      const uri = URI.file('README.md').toString();

      thread.addMessageAttachment(uri, content);
      const result = thread.sendMessage('test message');
      await new Promise((resolve) => setImmediate(resolve));
      setImmediate(() => navieEventEmitter.emit('ack', 'user-message-id'));

      await expect(result).resolves.toBeUndefined();
      expect(mockNavie.ask).toHaveBeenCalledWith(
        thread.conversationThread.id,
        'test message',
        [{ content, location: uri, type: 'code-snippet' }],
        undefined
      );
    });
  });

  describe('addMessageAttachment', () => {
    it('emits an `add-message-attachment` event', () => {
      const listener = jest.fn();
      thread.on('event', 'test-client', listener);
      const uri = URI.random().toString();
      const content = 'test-content';
      thread.addMessageAttachment(uri, content);
      expect(listener).toHaveBeenCalledWith({
        type: 'add-message-attachment',
        uri,
        content: 'test-content',
        time: expect.any(Number),
      });
    });
  });

  describe('removeMessageAttachment', () => {
    it('emits an `remove-message-attachment` event', () => {
      const listener = jest.fn();
      const uri = URI.random().toString();
      thread.on('event', 'test-client', listener);
      thread.removeMessageAttachment(uri);
      expect(listener).toHaveBeenCalledWith({
        type: 'remove-message-attachment',
        uri,
        time: expect.any(Number),
      });
    });
  });

  describe('getMessageAttachments', () => {
    it('returns an attachment that was added since the last user message', () => {
      const content = 'test-content';
      const uri = 'urn:uuid:0';
      thread.addMessageAttachment(uri, content);
      expect(thread.getMessageAttachments()).toStrictEqual([
        { uri, content, time: expect.any(Number), type: 'add-message-attachment' },
      ]);
    });

    it('ignores attachments that were added before the last user message', () => {
      thread.addMessageAttachment('file://test-attachment-id');
      thread.logEvent({ type: 'message', role: 'user', content: 'test', messageId: '1' });
      expect(thread.getMessageAttachments()).toStrictEqual([]);
    });

    it('ignores attachments that were removed', () => {
      const uri = 'file:test-uri.md';
      thread.addMessageAttachment(uri);
      thread.removeMessageAttachment(uri);
      expect(thread.getMessageAttachments()).toStrictEqual([]);
    });
  });

  describe('getEvents', () => {
    const events: NavieEvent[] = [
      { type: 'message', role: 'assistant', content: 'test', messageId: '1' },
      { type: 'message', role: 'user', content: 'test', messageId: '2' },
      { type: 'message', role: 'assistant', content: 'test', messageId: '3' },
      { type: 'message', role: 'user', content: 'test', messageId: '4' },
    ];

    beforeEach(() => {
      events.forEach((e) => thread.logEvent(e));
    });

    it('returns the full event log', () => {
      expect(thread.getEvents()).toStrictEqual(
        events.map((e) => ({ ...e, time: expect.any(Number) }))
      );
    });

    it('returns the event log since the given nonce', () => {
      expect(thread.getEvents(2)).toStrictEqual(
        events.slice(2).map((e) => ({ ...e, time: expect.any(Number) }))
      );
    });
  });

  describe('getChatHistory', () => {
    it('returns the full chat history', () => {
      const events: NavieMessageEvent[] = [
        { type: 'message', role: 'assistant', content: 'test', messageId: '1' },
        { type: 'message', role: 'user', content: 'test', messageId: '2' },
        { type: 'message', role: 'assistant', content: 'test', messageId: '3' },
        { type: 'message', role: 'user', content: 'test', messageId: '4' },
      ];
      events.forEach((e) => thread.logEvent(e));
      expect(thread.getChatHistory()).toStrictEqual(
        events.map(({ role, content }) => ({ role, content }))
      );
    });

    it('reconstructs tokenized messages', () => {
      const events: NavieEvent[] = [
        { type: 'message', role: 'user', content: 'hello', messageId: '1' },
        { type: 'token', token: 'hello', messageId: '2' },
        { type: 'token', token: ' ', messageId: '2' },
        { type: 'token', token: 'user', messageId: '2' },
        { type: 'token', token: '!', messageId: '2' },
        { type: 'message-complete', messageId: '2' },
        { type: 'message', role: 'user', content: ':)', messageId: '1' },
      ];
      events.forEach((e) => thread.logEvent(e));
      expect(thread.getChatHistory()).toStrictEqual([
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hello user!' },
        { role: 'user', content: ':)' },
      ]);
    });
  });
});
