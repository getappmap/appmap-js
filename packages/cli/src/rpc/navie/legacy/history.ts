import { UserContext, Navie } from '@appland/navie';
import LegacyThread, { ThreadData } from './thread';
import { join } from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';
import configuration from '../../configuration';
import { homedir } from 'os';
import { existsSync, mkdirSync } from 'fs';
import { verbose } from '../../../utils';

export class ThreadAccessError extends Error {
  constructor(public readonly threadId: string, public action: string, public cause?: Error) {
    super(ThreadAccessError.errorMessage(threadId, action, cause));
  }

  static errorMessage(threadId: string, action: string, cause?: Error): string {
    const messages = [`Failed to ${action} thread ${threadId}`];
    if (cause) messages.push(cause.message);
    return messages.join(': ');
  }
}

export default class LegacyHistory {
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private static THREADS = new Map<string, LegacyThread>();
  private static readonly DEBOUNCE_TIME = 1000;

  constructor(public readonly directory: string) {}

  token(threadId: string, userMessageId: string, assistantMessageId: string, token: string): void {
    const thread = this.getOrCreateThread(threadId);
    const exchange = thread.exchanges.find(({ question }) => question.messageId === userMessageId);
    if (!exchange) {
      throw new Error(`no exchange found for user message ${userMessageId}`);
    }
    if (!exchange.answer) {
      exchange.answer = {
        messageId: assistantMessageId,
        role: 'assistant',
        content: '',
      };
    }
    exchange.answer.content += token;
    this.writeThread(threadId);
  }

  question(
    threadId: string,
    userMessageId: string,
    question: string,
    codeSelection: UserContext.Context | undefined,
    prompt: string | undefined
  ): void {
    const thread = this.getOrCreateThread(threadId);
    const timestamp = new Date();
    const serializedCodeSelection = codeSelection ? JSON.stringify(codeSelection) : undefined;
    thread.question(timestamp.getTime(), userMessageId, question, serializedCodeSelection, prompt);
    this.writeThread(threadId);
  }

  async load(threadId: string): Promise<LegacyThread> {
    let thread = LegacyHistory.THREADS.get(threadId);
    if (!thread) {
      const filePath = join(this.directory, `${threadId}.json`);
      try {
        const serialized = await readFile(filePath, 'utf-8');
        thread = LegacyThread.fromJSON(threadId, JSON.parse(serialized) as ThreadData);
      } catch (e) {
        throw new ThreadAccessError(
          threadId,
          'load',
          e instanceof Error ? e : new Error(String(e))
        );
      }
      LegacyHistory.THREADS.set(threadId, thread);
    }
    return thread;
  }

  private getOrCreateThread(threadId: string): LegacyThread {
    let thread = LegacyHistory.THREADS.get(threadId);
    if (!thread) {
      thread = new LegacyThread(threadId, Date.now(), configuration().projectDirectories);
      LegacyHistory.THREADS.set(threadId, thread);
    }
    return thread;
  }

  private writeThread(threadId: string) {
    const timer = this.debounceTimers.get(threadId);
    if (timer) return;

    this.debounceTimers.set(
      threadId,
      setTimeout(() => {
        this.debounceTimers.delete(threadId);

        const thread = LegacyHistory.THREADS.get(threadId);
        if (!thread) {
          console.warn(`tried to write thread ${threadId} to file, but it was not found`);
          return;
        }

        const serialized = JSON.stringify(thread.asJSON());
        const filePath = join(this.directory, `${thread.threadId}.json`);
        mkdir(this.directory, { recursive: true })
          .then(() => writeFile(filePath, serialized))
          .catch((e) => {
            console.warn(`failed to write thread ${thread.threadId} to file ${filePath}: ${e}`);
          });
      }, LegacyHistory.DEBOUNCE_TIME)
    );
  }

  /**
   * Initializes the default history directory and returns a new instance of LegacyHistory.
   * @returns A promise that resolves to a new instance of LegacyHistory.
   * @throws If the history directory cannot be created.
   */
  static initialize(): LegacyHistory {
    const historyDir = join(homedir(), '.appmap', 'navie', 'history');
    if (!existsSync(historyDir)) {
      mkdirSync(historyDir, { recursive: true });
    }
    return new LegacyHistory(historyDir);
  }
}
