import { NavieRpc } from '@appland/rpc';
import { IncomingMessage, NextFunction } from 'connect';
import { warn } from 'console';
import { ServerResponse } from 'http';
import { getThread } from '.';
import type { Thread } from '.';
import { randomUUID } from 'crypto';

class EventStream {
  constructor(private readonly res: ServerResponse) {
    this.prepareResponse();
  }

  private prepareResponse() {
    this.res
      .setHeader('Content-Type', 'text/event-stream; charset=utf-8')
      .setHeader('Cache-Control', 'no-cache')
      .setHeader('Connection', 'keep-alive');
  }

  on(event: 'close', listener: () => void): this;
  on(event: string, listener: (...args: unknown[]) => void): this {
    this.res.on(event, listener);
    return this;
  }

  send(event: Record<string, unknown>) {
    this.res.write(`data: ${JSON.stringify(event)}\n\n`, 'utf-8');
  }

  end() {
    this.res.end();
  }
}

export async function handler(
  eventStream: EventStream,
  threadId: string,
  nonce?: number,
  replay?: boolean
) {
  let thread: Thread;
  try {
    thread = await getThread(threadId);
  } catch (e) {
    warn(`Failed to load thread ${threadId}: ${e}`);
    eventStream.send({ type: 'error', error: e, code: 'missing-thread' });
    return;
  }

  const events = thread.getEvents(nonce);
  if (replay) {
    let lastEventTime = events[0]?.time ?? 0;
    for (const event of events) {
      await new Promise((resolve) => setTimeout(resolve, event.time - lastEventTime));
      eventStream.send(event);
      lastEventTime = event.time;
    }
  } else {
    events.forEach((e) => eventStream.send(e));
  }

  const clientId = randomUUID();
  thread.on('event', clientId, (event) => {
    eventStream.send(event);
  });

  eventStream.on('close', () => {
    thread.removeAllListeners(clientId);
  });
}

export function sseMiddleware(
  req: IncomingMessage & {
    body?: { method?: string; params?: NavieRpc.V1.Thread.Subscribe.Params };
  },
  res: ServerResponse,
  next: NextFunction
) {
  if (req.body?.method === NavieRpc.V1.Thread.Subscribe.Method) {
    const { params } = req.body;
    if (!params?.threadId) {
      res.writeHead(400);
      res.end();
      return;
    }

    const eventStream = new EventStream(res);
    handler(eventStream, params.threadId, params?.nonce, params?.replay).catch(next);
  } else {
    next();
  }
}
