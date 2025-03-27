import { Thread } from '../thread';
import { ConversationThread } from '@appland/client';
import { ThreadIndexService } from './threadIndexService';
import { inject, injectable, singleton } from 'tsyringe';
import { NavieThreadInitEvent, TimestampNavieEvent } from '../thread/events';
import { readFile } from 'node:fs/promises';
import NavieService from './navieService';

type ThreadId = string;

/**
 * A service for managing Navie conversation threads. Threads are stored in memory and can be
 * retrieved from memory or loaded from disk if they are not in memory.
 */
@singleton()
@injectable()
export default class ThreadService {
  private readonly memoryThreads = new Map<ThreadId, Thread>();

  constructor(
    @inject(ThreadIndexService) private readonly threadIndexService: ThreadIndexService,
    @inject(NavieService) private readonly navieService: NavieService
  ) {}

  /**
   * Returns a thread from memory or loads it from disk if it's not yet in memory. If the thread is
   * not found, or the load fails, an error will be thrown.
   * @param threadId the thread identifier to retrieve
   * @returns the thread
   */
  async getThread(threadId: string): Promise<Thread> {
    let thread = this.memoryThreads.get(threadId);
    if (!thread) {
      try {
        thread = await this.loadFromDisk(threadId);
      } catch (e) {
        // misbehaving threads will be deleted from the index
        // they probably no longer exist
        this.threadIndexService.delete(threadId);
        throw e;
      }
      this.memoryThreads.set(thread.conversationThread.id, thread);
    }
    return thread;
  }

  async loadFromDisk(threadId: string): Promise<Thread> {
    const historyFilePath = Thread.getHistoryFilePath(threadId);
    let initEvent: NavieThreadInitEvent | undefined;
    const eventLog: TimestampNavieEvent[] = [];

    try {
      const jsonLines = await readFile(historyFilePath, 'utf-8').then((data) => data.split('\n'));
      for (const json of jsonLines) {
        if (json.length === 0) continue;
        try {
          const event = JSON.parse(json) as TimestampNavieEvent;
          if (!initEvent && event.type === 'thread-init') {
            initEvent = event;
          }
          eventLog.push(event);
        } catch (e) {
          console.error('Failed to parse event', json, e);
        }
      }
    } catch (e) {
      throw new Error(`Failed to load history file ${historyFilePath}: ${String(e)}`);
    }

    if (!initEvent) throw new Error('Thread init event not found');

    return new Thread(initEvent.conversationThread, this.navieService, eventLog);
  }

  /**
   * Registers a thread with the service. This will initialize the thread and add it to memory. If
   * the thread is already registered, an error will be thrown.
   *
   * @param conversationThread The thread to register
   */
  registerThread(conversationThread: ConversationThread) {
    if (this.memoryThreads.has(conversationThread.id)) {
      throw new Error(`Thread ${conversationThread.id} is already registered`);
    }

    const thread = new Thread(conversationThread, this.navieService);
    thread.initialize();

    this.memoryThreads.set(conversationThread.id, thread);
  }
}
