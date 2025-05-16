import { Message, Navie, UserContext } from '@appland/navie';
import { dirname, join } from 'path';
import { EventEmitter } from 'stream';
import { ConversationThread } from '@appland/client';
import { getSuggestions } from '../suggest';
import { homedir } from 'os';
import { mkdir, writeFile } from 'fs/promises';

import NavieService from '../services/navieService';
import {
  NavieErrorEvent,
  NavieAddMessageAttachmentEvent,
  NavieEvent,
  NavieMessageEvent,
  TimestampNavieEvent,
} from './events';
import { ThreadIndexService } from '../services/threadIndexService';
import { container } from 'tsyringe';
import { NavieRpc, URI } from '@appland/rpc';
import handleReview from '../../explain/review';
import { getTokenizedString, hasCode, hasMessage, hasNestedError, hasStatus } from './util';
import INavie from '../../explain/navie/inavie';
import { normalizePath } from '../../explain/location';
import { isNativeError } from 'util/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventListener = (...args: any[]) => void;

/**
 * Converts the simplified context format back into the format expected by Navie.
 * Why two formats? Because the difference between a `code-snippet` and a `code-selection` is too
 * ambiguous, and `file` too specific. Ideally I'd like to migrate to use this static/dynamic format
 * everywhere, but it works for now. - DB
 */
function convertContext(context?: NavieRpc.V1.Thread.ContextItem[]): UserContext.ContextItem[] {
  if (!context) return [];
  return context.map((item) => {
    let location = item.uri;
    try {
      const uri = URI.parse(item.uri);
      if (uri.scheme === 'file') {
        location = uri.fsPath;
        if (uri.range) {
          location += [uri.range.start, uri.range.end].filter(Boolean).join('-');
        }
        location = normalizePath(location);
      }
    } catch (e) {
      console.warn('[convertContext]', e);
    }
    if (item.content) {
      return { type: 'code-snippet', content: item.content, location };
    }
    return { type: 'file', location };
  });
}

function convertMessageAttachmentToContextItem(
  attachment: NavieAddMessageAttachmentEvent
): UserContext.ContextItem {
  return {
    type: 'code-snippet',
    content: attachment.content ?? '',
    location: attachment.uri,
  };
}

interface FlushOptions {
  updateIndex?: boolean;
}

export class Thread {
  private activeNavie?: INavie;
  private eventEmitter = new EventEmitter();
  private listeners = new Map<string, EventListener[]>();
  private log: TimestampNavieEvent[] = [];
  private codeBlockUri: string | undefined;
  private codeBlockLength: number | undefined;
  private lastEventWritten = 0;
  private lastTokenBeganCodeBlock = false;
  private static readonly HISTORY_DIRECTORY = join(homedir(), '.appmap', 'navie', 'history');

  constructor(
    public readonly conversationThread: ConversationThread,
    private readonly navieService: NavieService,
    eventLog?: TimestampNavieEvent[]
  ) {
    if (eventLog?.length) {
      this.log = eventLog;
      this.lastEventWritten = this.log.length;
    }
  }

  async initialize() {
    this.logEvent({ type: 'thread-init', conversationThread: this.conversationThread });
    await this.flush().catch(console.error);
  }

  private logEvent(event: NavieEvent) {
    const timeStamped = { ...event, time: Date.now() };
    this.log.push(timeStamped);
    this.eventEmitter.emit('event', timeStamped);
  }

  private async emitSuggestions(messageId: string) {
    const suggestions = await getSuggestions(
      this.navieService.navieProvider,
      this.conversationThread.id
    );
    this.logEvent({ type: 'prompt-suggestions', suggestions, messageId });
    this.flush().catch(console.error);
  }

  static getHistoryFilePath(threadId: string) {
    return join(Thread.HISTORY_DIRECTORY, `${threadId}.navie.jsonl`);
  }

  on(event: 'event', clientId: string, listener: (event: NavieEvent) => void): this;

  /**
   * Bind to the given event. A client identifier is used to associate a client with bound
   * listeners. The listening client must call `removeAllListeners` when it disconnects.
   *
   * @param event the event to listen for
   * @param clientId a unique identifier for the client
   * @param listener the listener to call when the event is emitted
   * @returns this
   */
  on(event: string, clientId: string, listener: EventListener): this {
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

  /**
   * Remove all listeners bound to the given client identifier.
   *
   * @param clientId the client identifier to remove
   */
  removeAllListeners(clientId: string) {
    const listeners = this.listeners.get(clientId);
    if (!listeners) return;

    for (const listener of listeners) {
      this.eventEmitter.removeListener('event', listener);
    }

    this.listeners.delete(clientId);
  }

  /**
   * Flush the event log to disk. This is called automatically when a new message is finalized.
   */
  private async flush({ updateIndex = false }: FlushOptions = {}) {
    if (this.log.length === this.lastEventWritten) return;

    const historyFilePath = Thread.getHistoryFilePath(this.conversationThread.id);
    const serialized = this.log.slice(this.lastEventWritten ?? 0).map((e) => JSON.stringify(e));

    try {
      await mkdir(dirname(historyFilePath), { recursive: true });
      await writeFile(historyFilePath, serialized.join('\n') + '\n', { flag: 'a' });
      this.lastEventWritten = this.log.length;
    } catch (e) {
      console.error('failed to write to history file', e);
    }

    if (updateIndex) {
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
        const threadIndexService = container.resolve(ThreadIndexService);
        threadIndexService.index(this.conversationThread.id, historyFilePath, title);
      } catch (e) {
        console.error('failed to update thread index', e);
      }
    }
  }

  /**
   * Pin an item in the thread. This will emit a `pin-item` event. This item won't actually be
   * propagated to the backend unless sent by the client via `sendMessage`. This can change in the
   * future.
   *
   * @param item the item to pin
   */
  pinItem(uri: string, content?: string) {
    this.logEvent({ type: 'pin-item', uri, content });
    this.flush().catch(console.error);
  }

  /**
   * Unpin an item in the thread. This will emit a `unpin-item` event.
   *
   * @param item the item to unpin
   */
  unpinItem(uri: string) {
    this.logEvent({ type: 'unpin-item', uri });
    this.flush().catch(console.error);
  }

  /**
   * This function is responsible for pre-processing and token emission. It keeps track of active
   * code blocks and strips out <!-- file: ... --> comments, instead emitting them as metadata.
   *
   * @param token The token to be processed and emitted
   * @param messageId The message id associated with the token
   */
  private onToken(token: string, messageId: string) {
    const subTokens = token.split(/^(\s*?`{3,})/gm);
    for (let subToken of subTokens) {
      if (subToken.length === 0) continue;

      const fileMatch = subToken.match(/^\s*?<!-- file: (.*) -->\s*?\n?/m);
      if (fileMatch) {
        // TODO: Should this be a file URI? We don't currently include line ranges.
        this.codeBlockUri = this.codeBlockUri ?? URI.random().toString();
        this.logEvent({
          type: 'token-metadata',
          codeBlockUri: this.codeBlockUri,
          metadata: {
            location: fileMatch[1],
          },
        });

        // Remove the file directive from the token
        const index = fileMatch.index ?? 0;
        subToken = subToken.slice(0, index) + subToken.slice(index + fileMatch[0].length);
        if (subToken.length === 0) continue;
      }

      const language = this.lastTokenBeganCodeBlock ? subToken.match(/^[^\s]+\n/) : null;
      if (language && this.codeBlockUri) {
        this.logEvent({
          type: 'token-metadata',
          codeBlockUri: this.codeBlockUri,
          metadata: {
            language: language[0].trim(),
          },
        });
      }

      this.lastTokenBeganCodeBlock = false;

      let clearCodeBlock = false;
      if (subToken.match(/^\s*?`{3,}/)) {
        // Code block fences
        if (this.codeBlockLength === undefined) {
          this.codeBlockUri = this.codeBlockUri ?? URI.random().toString();
          this.codeBlockLength = subToken.length;
          this.lastTokenBeganCodeBlock = true;
        } else if (subToken.length === this.codeBlockLength) {
          clearCodeBlock = true;
        }
      }

      // If we're not in a code block, allow parsing of XML tags and conversion into object tokens
      if (!this.codeBlockUri) {
        getTokenizedString(subToken).forEach((part) =>
          this.logEvent({
            type: 'token',
            token: part,
            messageId,
          })
        );
      } else {
        this.logEvent({
          type: 'token',
          token: subToken,
          messageId,
          codeBlockUri: this.codeBlockUri,
        });
      }

      if (clearCodeBlock) {
        this.codeBlockUri = undefined;
        this.codeBlockLength = undefined;
      }
    }
  }

  /**
   * Send a user message to the thread. This will emit a `message` event. This promise will resolve
   * once the message has been acknowledged by the backend, before the message is completed. Message
   * attachments need NOT be included in the `userContext` parameter.
   *
   * @param message the message to send
   * @param codeSelection (optional) additional context to use, i.e., pinned items
   */
  async sendMessage(
    message: string,
    userContext?: NavieRpc.V1.Thread.ContextItem[]
  ): Promise<void> {
    const [navie, contextEvents] = this.navieService.getNavie();

    let context = convertContext(userContext);
    context.push(...this.getMessageAttachments().map(convertMessageAttachmentToContextItem));

    const { applied, userContext: newUserContext } = await handleReview(message, context);
    if (applied && newUserContext) {
      context = newUserContext;
    }

    let responseId: string | undefined;
    contextEvents.on('context', (event) => {
      event.complete
        ? this.logEvent({ type: 'complete-context-search', id: event.id, result: event.response })
        : this.logEvent({
            type: 'begin-context-search',
            id: event.id,
            request: event.request,
            contextType: event.type,
          });
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
          this.flush({ updateIndex: true }).catch(console.error);
          this.activeNavie = navie;
          resolve();
        })
        .on('token', (token: string, messageId: string) => {
          if (!responseId) responseId = messageId;
          this.onToken(token, messageId);
        })
        .on('error', (err: unknown) => {
          const error: NavieErrorEvent['error'] = { message: 'unknown error' };
          if (hasNestedError(err)) {
            error.message = err.error.message;
          } else if (isNativeError(err) || hasMessage(err)) {
            error.message = err.message;
          } else if (typeof err === 'object' && err !== null) {
            error.message = JSON.stringify(err);
          } else if (typeof err === 'string') {
            error.message = err;
          }

          let code: string | number | undefined;
          if (hasCode(err)) {
            code = err.code;
          } else if (hasStatus(err)) {
            code = err.status;
          }

          if (typeof code === 'string') {
            code = parseInt(code, 10);
            if (!isNaN(code)) error.code = code;
          } else if (typeof code === 'number') {
            error.code = code;
          }

          this.logEvent({ type: 'error', error });
          this.activeNavie = undefined;
          reject(error);
        })
        .on('complete', () => {
          this.activeNavie = undefined;
          if (!responseId) throw new Error('recieved complete without messageId');
          this.logEvent({ type: 'message-complete', messageId: responseId });
          this.flush()
            .then(() => this.emitSuggestions(responseId!))
            .then(() => this.flush())
            .catch(console.error);
        })
        .ask(this.conversationThread.id, message, context, undefined)
        .catch((e) => {
          this.activeNavie = undefined;
          reject(e);
        });
    });
  }

  addMessageAttachment(uri: string, content?: string) {
    this.logEvent({
      type: 'add-message-attachment',
      uri,
      content,
    });
    this.flush().catch(console.error);
  }

  removeMessageAttachment(uri: string) {
    // There's no validation that the attachmentId is valid.
    // This will be up to the client to figure out.
    this.logEvent({ type: 'remove-message-attachment', uri });
    this.flush().catch(console.error);
  }

  getMessageAttachments(): NavieAddMessageAttachmentEvent[] {
    // Array.lastIndexOf is not supported until es2023.
    let lastUserMessageIndex = -1;
    for (let i = 0; i < this.log.length; ++i) {
      const e = this.log[i];
      if (e.type === 'message' && e.role === 'user') {
        lastUserMessageIndex = i;
      }
    }

    const attachments = new Map<string, NavieAddMessageAttachmentEvent>();
    for (let i = lastUserMessageIndex + 1; i < this.log.length; ++i) {
      const e = this.log[i];
      if (e.type === 'add-message-attachment') {
        attachments.set(e.uri, e);
      } else if (e.type === 'remove-message-attachment') {
        attachments.delete(e.uri);
      }
    }

    return Array.from(attachments.values());
  }

  /**
   * Gets the events since the given nonce. If no nonce is given, it will return all events.
   *
   * @param sinceNonce The nonce to start from
   * @returns The events since the given nonce
   */
  getEvents(sinceNonce?: number): readonly TimestampNavieEvent[] {
    return this.log.slice(sinceNonce ?? 0);
  }

  /**
   * Converts the event log into a chat history. Keep in mind that this processes every event in the
   * log, so the return value should be cached when possible.
   *
   * @returns The chat history
   */
  getChatHistory(): Navie.ChatHistory {
    const chatHistory: Navie.ChatHistory = [];
    const streamingMessages = new Map<string, Message>();
    for (const event of this.log) {
      if (event.type === 'message') {
        chatHistory.push({ role: event.role, content: event.content });
      }
      if (event.type === 'token') {
        let message = streamingMessages.get(event.messageId);
        if (!message) {
          message = {
            role: 'assistant',
            content: '',
          };
          streamingMessages.set(event.messageId, message);
          chatHistory.push(message);
        }
        message.content += typeof event.token === 'string' ? event.token : event.token.raw;
      }
      if (event.type === 'message-complete') {
        streamingMessages.delete(event.messageId);
      }
    }
    return chatHistory;
  }

  /**
   * Terminates the active Navie instance. This will stop any active completions.
   * @returns Whether an active Navie instance was terminated.
   */
  stopCompletion(): boolean {
    this.activeNavie?.terminate();
    return this.activeNavie !== undefined;
  }
}
