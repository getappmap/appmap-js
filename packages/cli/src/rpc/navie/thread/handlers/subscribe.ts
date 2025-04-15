import { warn } from 'console';
import type { Thread } from '..';
import { randomUUID } from 'crypto';
import ThreadService from '../../services/threadService';
import { WebSocket, WebSocketServer } from 'ws';
import { container } from 'tsyringe';
import { IncomingMessage } from 'http';
import { parse } from 'url';

export async function handler(
  threadService: ThreadService,
  socket: WebSocket,
  threadId: string,
  nonce?: number,
  replay?: boolean
) {
  const emit = (event: unknown) => socket.send(JSON.stringify(event));
  let thread: Thread;
  try {
    thread = await threadService.getThread(threadId);
  } catch (e) {
    warn(`Failed to load thread ${threadId}: ${e}`);
    emit({ type: 'error', error: e, code: 'missing-thread' });
    return;
  }

  const events = thread.getEvents(nonce);
  if (replay) {
    // This event lets the client know that they do not need to buffer events.
    emit({ type: 'stream-start' });
    let lastEventTime = events[0]?.time ?? 0;
    for (const event of events) {
      await new Promise((resolve) => setTimeout(resolve, event.time - lastEventTime));
      emit(event);
      lastEventTime = event.time;
    }
  } else {
    events.forEach((e) => emit(e));
    emit({ type: 'stream-start' });
  }

  const clientId = randomUUID();
  thread.on('event', clientId, (event) => emit(event));
  socket.on('close', () => thread.removeAllListeners(clientId));
}

export function bindConnectionHandler(wss: WebSocketServer) {
  const threadService = container.resolve(ThreadService);
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const url = parse(req.url ?? '', true);
    const threadId = url.query.threadId as string;
    const nonce = url.query.nonce ? parseInt(url.query.nonce as string, 10) : undefined;
    const replay = url.query.replay ? (url.query.replay as string) === 'true' : undefined;
    if (!threadId) {
      ws.close(
        400,
        JSON.stringify({
          type: 'error',
          error: 'threadId must be provided',
          code: 'missing-argument',
        })
      );
    }

    handler(threadService, ws, threadId, nonce, replay).catch((e) => {
      ws.close(500, JSON.stringify({ type: 'error', error: e, code: 'internal-error' }));
    });
  });
}
