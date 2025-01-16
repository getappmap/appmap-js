import { ContextV2, Help, ProjectInfo, UserContext } from '@appland/navie';
import {  dirname, join } from 'path';
import { EventEmitter } from 'stream';
import { randomUUID } from 'crypto';
import { ConversationThread } from '@appland/client';
import { getSuggestions } from '../suggest';
import { NavieRpc } from '@appland/rpc';
import { homedir } from 'os';
import { mkdir, readFile, writeFile } from 'fs/promises';
import sqlite3 from 'better-sqlite3';
import NavieService from '../services/navieService';

type NavieThreadInitEvent = {
  type: 'thread-init';
  conversationThread: ConversationThread;
};

type NavieTokenMetadataEvent = {
  type: 'token-metadata';
  codeBlockId: string;
  metadata: Record<string, unknown>;
};

type NavieTokenEvent = {
  type: 'token';
  messageId: string;
  token: string;
  codeBlockId?: string;
};

type NavieMessageEvent = {
  type: 'message';
  role: 'system' | 'assistant' | 'user';
  messageId: string;
  content: string;
};

type NaviePromptSuggestionsEvent = {
  type: 'prompt-suggestions';
  suggestions: NavieRpc.V1.Suggest.Response;
  messageId: string;
};

type NavieMessageCompleteEvent = {
  type: 'message-complete';
  messageId: string;
};

type NaviePinItemEvent = PinnedItem & {
  type: 'pin-item';
};

type NavieErrorEvent = {
  type: 'error';
  error: unknown;
};

type NavieBeginContextSearchEvent = {
  type: 'begin-context-search';
  contextType: 'help' | 'project-info' | 'context';
  id: string;
};

type NavieCompleteContextSearchEvent = {
  type: 'complete-context-search';
  id: string;
  result: Help.HelpResponse | ProjectInfo.ProjectInfoResponse | ContextV2.ContextResponse;
};

type Timestamp = {
  time: number;
};

type NavieEvent =
  | NavieBeginContextSearchEvent
  | NavieCompleteContextSearchEvent
  | NavieErrorEvent
  | NavieMessageEvent
  | NavieMessageCompleteEvent
  | NaviePinItemEvent
  | NaviePromptSuggestionsEvent
  | NavieThreadInitEvent
  | NavieTokenEvent
  | NavieTokenMetadataEvent;

type TimestampNavieEvent = Timestamp & NavieEvent;

type PinnedItem = {
  operation: 'pin' | 'unpin';
  uri?: string;
  handle?: number;
};

type EventListener = (...args: any[]) => void;

export class Thread {
  private eventEmitter = new EventEmitter();
  private listeners = new Map<string, EventListener[]>();
  private log: TimestampNavieEvent[] = [];
  private codeBlockId: string | undefined;
  private codeBlockLength: number | undefined;
  private lastEventWritten: number | undefined;
  private lastTokenBeganCodeBlock = false;
  private static readonly HISTORY_DIRECTORY = join(homedir(), '.appmap', 'navie', 'history');

  constructor(public readonly conversationThread: ConversationThread) {}

  initialize() {
    this.logEvent({ type: 'thread-init', conversationThread: this.conversationThread });
  }

  private logEvent(event: NavieEvent) {
    const timeStamped = { ...event, time: Date.now() };
    this.log.push(timeStamped);
    this.eventEmitter.emit('event', timeStamped);
  }

  private async emitSuggestions(messageId: string) {
    const suggestions = await getSuggestions(
      NavieService.getNavieProvider(),
      this.conversationThread.id
    );
    this.logEvent({ type: 'prompt-suggestions', suggestions, messageId });
  }

  static async load(threadId: string): Promise<Thread> {
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

    const thread = new Thread(initEvent.conversationThread);
    thread.log = eventLog;
    thread.lastEventWritten = eventLog.length;

    return thread;
  }

  static getHistoryFilePath(threadId: string) {
    return join(Thread.HISTORY_DIRECTORY, `${threadId}.navie.jsonl`);
  }

  on(event: 'event', clientId: string, listener: (event: NavieEvent) => void): this;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, clientId: string, listener: (...args: any[]) => void): this {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    this.eventEmitter.on(event, listener);

    // Keep track of listeners for each client
    // When the client disconnects, we can remove all listeners for that client
    let listeners = this.listeners.get(clientId);
    if (!listeners) {
      listeners = [listener];
      this.listeners.set(clientId, listeners);
    }
    listeners.push(listener);

    return this;
  }

  removeAllListeners(clientId: string) {
    const listeners = this.listeners.get(clientId);
    if (!listeners) return;

    for (const listener of listeners) {
      this.eventEmitter.removeListener('event', listener);
    }
  }

  private async flush() {
    if (this.log.length === this.lastEventWritten) return;

    const historyFilePath = Thread.getHistoryFilePath(this.conversationThread.id);
    const serialized = this.log.slice(this.lastEventWritten ?? 0).map((e) => JSON.stringify(e));

    try {
      await mkdir(dirname(historyFilePath), { recursive: true });
      await writeFile(historyFilePath, serialized.join('\n') + '\n', { flag: 'a' });
      this.lastEventWritten = this.log.length;
    } catch (e) {
      console.error('Failed to write to history file', e);
    }

    try {
      let lastUserMessage: NavieMessageEvent | undefined;
      for (let i = this.log.length - 1; i >= 0; i--) {
        const e = this.log[i];
        if (e.type === 'message' && e.role === 'user') {
          lastUserMessage = e;
          break;
        }
      }
      const title = lastUserMessage?.content.slice(0, 100);
      ThreadIndex.getInstance().index(this.conversationThread.id, historyFilePath, title);
    } catch (e) {
      console.error('Failed to update thread index', e);
    }
  }

  pinItem(item: PinnedItem) {
    this.logEvent({ type: 'pin-item', ...item });
  }

  sendMessage(message: string, codeSelection?: UserContext.Context) {
    const [navie, contextEvents] = NavieService.getNavie();
    let responseId: string | undefined;
    contextEvents.on('event', (event) => {
      event.complete ?
      this.logEvent({type: 'complete-context-search', id: event.id, result: event.response}) :
    });
    return new Promise<void>((resolve, reject) => {
      navie
        .on('ack', (userMessageId: string) => {
          this.logEvent({
            type: 'message',
            role: 'user',
            messageId: userMessageId,
            content: message,
          });
          resolve();
        })
        .on('token', (token: string, messageId: string) => {
          if (!responseId) responseId = messageId;

          const subTokens = token.split(/^(`{3,})\n?/gm);
          for (const subToken of subTokens) {
            if (subToken.length === 0) continue;

            const fileMatch = subToken.match(/^<!-- file: (.*) -->/);
            if (fileMatch) {
              this.codeBlockId = this.codeBlockId ?? randomUUID();
              this.logEvent({
                type: 'token-metadata',
                codeBlockId: this.codeBlockId,
                metadata: {
                  location: fileMatch[1],
                },
              });
              // Don't emit this token
              continue;
            }
            const language = this.lastTokenBeganCodeBlock ? subToken.match(/^[^\s]+\n/) : null;
            if (language && this.codeBlockId) {
              this.logEvent({
                type: 'token-metadata',
                codeBlockId: this.codeBlockId,
                metadata: {
                  language: language[0].trim(),
                },
              });
            }

            this.lastTokenBeganCodeBlock = false;

            let clearCodeBlock = false;
            if (subToken.match(/^`{3,}/)) {
              // Code block fences
              if (this.codeBlockLength === undefined) {
                this.codeBlockId = this.codeBlockId ?? randomUUID();
                this.codeBlockLength = subToken.length;
                this.lastTokenBeganCodeBlock = true;
              } else if (subToken.length === this.codeBlockLength) {
                clearCodeBlock = true;
              }
            }
            this.logEvent({
              type: 'token',
              token: subToken,
              messageId,
              codeBlockId: this.codeBlockId,
            });
            if (clearCodeBlock) {
              this.codeBlockId = undefined;
              this.codeBlockLength = undefined;
            }
          }
        })
        .on('error', (err: Error) => {
          this.logEvent({ type: 'error', error: err });
          reject(err);
        })
        .on('complete', () => {
          if (!responseId) throw new Error('recieved complete without messageId');
          this.logEvent({ type: 'message-complete', messageId: responseId });
          this.flush()
            .then(() => this.emitSuggestions(responseId!))
            .then(() => this.flush())
            .catch(console.error);
        })
        .ask(this.conversationThread.id, message, codeSelection, undefined)
        .catch(reject);
    });
  }

  getEvents(sinceNonce?: number): readonly TimestampNavieEvent[] {
    return this.log.slice(sinceNonce ?? 0);
  }
}

const threads = new Map<string, Thread>();
export function registerThread(conversationThread: ConversationThread) {
  const thread = new Thread(conversationThread);
  thread.initialize();
  console.log(`Registered thread ${conversationThread.id}`);
  threads.set(conversationThread.id, thread);
}

/**
 * Returns a thread from memory or loads it from disk if it's not yet in memory. If the thread is
 * not found, or the load fails, an error will be thrown.
 * @param threadId the thread identifier to retrieve
 * @returns the thread
 */
export async function getThread(threadId: string): Promise<Thread> {
  let thread = threads.get(threadId);
  if (!thread) {
    try {
      thread = await Thread.load(threadId);
    } catch (e) {
      // misbehaving threads will be deleted from the index
      // they probably no longer exist
      ThreadIndex.getInstance().delete(threadId);
      throw e;
    }
    threads.set(thread.conversationThread.id, thread);
  }
  return thread;
}

const INITIALIZE_SQL = `CREATE TABLE IF NOT EXISTS threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    path TEXT NOT NULL,
    title TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uuid_format CHECK (length(uuid) = 36)
);

CREATE INDEX IF NOT EXISTS idx_created_at ON threads (created_at);
CREATE INDEX IF NOT EXISTS idx_uuid ON threads (uuid);
`;

const QUERY_INSERT_SQL = `INSERT INTO threads (uuid, path, title) VALUES (?, ?, ?)
ON CONFLICT (uuid) DO UPDATE SET updated_at = CURRENT_TIMESTAMP, title = ?`;
const QUERY_DELETE_SQL = `DELETE FROM threads WHERE uuid = ?`;
interface QueryOptions {
  uuid?: string;
  maxCreatedAt?: Date;
  orderBy?: 'created_at' | 'updated_at';
  limit?: number;
  offset?: number;
}

interface ThreadIndexItem {
  id: string;
  path: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ThreadIndex {
  private readonly db: sqlite3.Database;
  private queryInsert: sqlite3.Statement;
  private queryDelete: sqlite3.Statement;

  private static readonly DATABASE_PATH = join(homedir(), '.appmap', 'navie', 'thread-index.db');
  private static instance: ThreadIndex;

  private constructor() {
    this.db = new sqlite3(ThreadIndex.DATABASE_PATH);
    this.db.exec(INITIALIZE_SQL);

    this.queryInsert = this.db.prepare(QUERY_INSERT_SQL);
    this.queryDelete = this.db.prepare(QUERY_DELETE_SQL);
  }

  static getInstance() {
    if (!ThreadIndex.instance) {
      ThreadIndex.instance = new ThreadIndex();
    }
    return ThreadIndex.instance;
  }

  index(threadId: string, path: string, title?: string) {
    return this.queryInsert.run(threadId, path, title, title);
  }

  delete(threadId: string) {
    return this.queryDelete.run(threadId);
  }

  query(options: QueryOptions): ThreadIndexItem[] {
    let queryString = `SELECT uuid as id, path, title, created_at, updated_at FROM threads`;
    const params: unknown[] = [];
    if (options.uuid) {
      queryString += ` WHERE uuid = ?`;
      params.push(options.uuid);
    }
    if (options.maxCreatedAt) {
      queryString += ` AND created_at < ?`;
      params.push(options.maxCreatedAt);
    }
    if (options.orderBy) {
      queryString += ` ORDER BY ? DESC`;
      params.push(options.orderBy);
    }
    if (options.limit) {
      queryString += ` LIMIT ?`;
      params.push(options.limit);
    }
    if (options.offset) {
      queryString += ` OFFSET ?`;
      params.push(options.offset);
    }
    const query = this.db.prepare(queryString);
    return query.all(...params) as ThreadIndexItem[];
  }
}

ThreadIndex.getInstance();
