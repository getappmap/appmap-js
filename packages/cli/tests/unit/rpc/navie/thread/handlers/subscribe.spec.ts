import { NavieRpc } from '@appland/rpc';
import { handler } from '../../../../../../src/rpc/navie/thread/handlers/subscribe';
import ThreadService from '../../../../../../src/rpc/navie/services/threadService';
import { EventStream } from '../../../../../../src/rpc/navie/thread/middleware';

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
describe(NavieRpc.V1.Thread.Subscribe.Method, () => {
  let mockEventStream: {
    on: jest.Mock;
    send: jest.Mock;
    end: jest.Mock;
  };
  let threadService: {
    getThread: jest.Mock;
  };
  let mockThread: {
    removeAllListeners: jest.Mock;
    getEvents: jest.Mock;
    on: jest.Mock;
  };

  beforeEach(() => {
    mockEventStream = {
      on: jest.fn(),
      send: jest.fn(),
      end: jest.fn(),
    };
    mockThread = {
      removeAllListeners: jest.fn(),
      getEvents: jest.fn().mockReturnValue([]),
      on: jest.fn(),
    };
    threadService = {
      getThread: jest.fn().mockResolvedValue(mockThread),
    };
  });

  it('replays events to the client', async () => {
    const events = [
      { type: 'message', role: 'assistant', content: 'test' },
      { type: 'message', role: 'user', content: 'test' },
      { type: 'message', role: 'assistant', content: 'test' },
    ];
    mockThread.getEvents.mockReturnValue(events);

    const threadId = 'example-thread-id';
    await handler(
      threadService as unknown as ThreadService,
      mockEventStream as unknown as EventStream,
      threadId,
      undefined,
      true
    );

    expect(threadService.getThread).toHaveBeenCalledWith(threadId);
    expect(mockThread.on).toHaveBeenCalledWith('event', expect.any(String), expect.any(Function));
    expect(mockThread.getEvents).toHaveBeenCalledWith(undefined);
    expect(mockEventStream.send.mock.calls.flat()).toStrictEqual(events);
  });

  it('streams new events to the client', async () => {
    await handler(
      threadService as unknown as ThreadService,
      mockEventStream as unknown as EventStream,
      'example-thread-id',
      undefined,
      true
    );

    // This is the listener function via: `thread.on('event', clientId, listener)`
    const bindListenerCalls = mockThread.on.mock.calls;
    expect(bindListenerCalls.length).toBe(1);
    expect(bindListenerCalls[0]).toStrictEqual(['event', expect.any(String), expect.any(Function)]);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const listener = bindListenerCalls[0][2] as (event: Record<string, unknown>) => void;
    const event = { type: 'message', role: 'assistant', content: 'test' };

    expect(mockEventStream.send).not.toHaveBeenCalled();
    listener(event);
    expect(mockEventStream.send).toHaveBeenCalledWith(event);
  });

  it('unbinds listeners when the stream is closed', async () => {
    await handler(
      threadService as unknown as ThreadService,
      mockEventStream as unknown as EventStream,
      'example-thread-id',
      undefined,
      true
    );

    const onCloseCalls = mockEventStream.on.mock.calls;
    expect(onCloseCalls.length).toBe(1);
    expect(onCloseCalls[0]).toStrictEqual(['close', expect.any(Function)]);

    // This is the listener function via: `eventStream.on('close', listener)`
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const listener = onCloseCalls[0][1] as () => void;
    listener();

    expect(mockThread.removeAllListeners).toHaveBeenCalledWith(expect.any(String));
  });

  it('emits an error if the thread cannot be loaded', async () => {
    threadService.getThread.mockRejectedValue(new Error('test error'));

    await handler(
      threadService as unknown as ThreadService,
      mockEventStream as unknown as EventStream,
      'example-thread-id',
      undefined,
      true
    );

    expect(mockEventStream.send).toHaveBeenCalledWith({
      type: 'error',
      error: new Error('test error'),
      code: 'missing-thread',
    });
  });
});
