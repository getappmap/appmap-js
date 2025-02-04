import { UserContext } from '@appland/navie';
import { ThreadAccessError } from './ihistory';
import IHistory from './ihistory';
import Thread, { ThreadData } from './thread';
import { join } from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';
import configuration from '../../configuration';

export default class HistoryWindows implements IHistory {
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private static THREADS = new Map<string, Thread>();
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

  async load(threadId: string): Promise<Thread> {
    let thread = HistoryWindows.THREADS.get(threadId);
    if (!thread) {
      const filePath = join(this.directory, `${threadId}.json`);
      try {
        const serialized = await readFile(filePath, 'utf-8');
        thread = Thread.fromJSON(threadId, JSON.parse(serialized) as ThreadData);
      } catch (e) {
        throw new ThreadAccessError(
          threadId,
          'load',
          e instanceof Error ? e : new Error(String(e))
        );
      }
      HistoryWindows.THREADS.set(threadId, thread);
    }
    return thread;
  }

  private getOrCreateThread(threadId: string): Thread {
    let thread = HistoryWindows.THREADS.get(threadId);
    if (!thread) {
      thread = new Thread(threadId, Date.now(), configuration().projectDirectories);
      HistoryWindows.THREADS.set(threadId, thread);
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

        const thread = HistoryWindows.THREADS.get(threadId);
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
      }, HistoryWindows.DEBOUNCE_TIME)
    );
  }
}
