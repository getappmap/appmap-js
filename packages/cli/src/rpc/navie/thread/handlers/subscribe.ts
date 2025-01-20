import { warn } from 'console';
import type { Thread } from '..';
import { randomUUID } from 'crypto';
import ThreadService from '../../services/threadService';
import { EventStream } from '../middleware';

export async function handler(
  threadService: ThreadService,
  eventStream: EventStream,
  threadId: string,
  nonce?: number,
  replay?: boolean
) {
  let thread: Thread;
  try {
    thread = await threadService.getThread(threadId);
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
