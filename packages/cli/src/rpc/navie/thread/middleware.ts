import { NavieRpc } from '@appland/rpc';
import { IncomingMessage, NextFunction } from 'connect';
import { ServerResponse } from 'http';
import { container } from 'tsyringe';
import ThreadService from '../services/threadService';
import { handler } from './handlers/subscribe';

export class EventStream {
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

/**
 * Accepts a JSON RPC request and begins streaming events through the connection. This middleware
 * is non-standard, and is only used for the `subscribe` command.
 
 * @returns a middleware function
 */
export function sseMiddleware() {
  const threadService = container.resolve(ThreadService);
  return (
    req: IncomingMessage & {
      body?: { method?: string; params?: NavieRpc.V1.Thread.Subscribe.Params };
    },
    res: ServerResponse,
    next: NextFunction
  ) => {
    if (req.body?.method === NavieRpc.V1.Thread.Subscribe.Method) {
      const { params } = req.body;
      if (!params?.threadId) {
        res.writeHead(400);
        res.end();
        return;
      }

      const eventStream = new EventStream(res);
      handler(threadService, eventStream, params.threadId, params?.nonce, params?.replay).catch(
        next
      );
    } else {
      next();
    }
  };
}
