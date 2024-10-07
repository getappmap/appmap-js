import { join } from 'path';
import { QuestionField, ResponseField, ThreadAccessError } from './ihistory';
import IHistory from './ihistory';
import Thread from './thread';
import { mkdir, writeFile } from 'fs/promises';

export default class HistoryWindows implements IHistory {
  constructor(public readonly directory: string) {
    console.warn('History is currently disabled. It is not yet implemented on Windows.');
  }

  private async appendItem(threadId: string, item: Record<string, unknown>): Promise<void> {
    const threadDir = join(this.directory, 'threads', threadId);
    await mkdir(threadDir, { recursive: true });

    const historyFile = join(threadDir, 'history.jsonl');
    await writeFile(historyFile, `${JSON.stringify(item)}\n`, { flag: 'a' });
  }

  token(
    threadId: string,
    userMessageId: string,
    assistantMessageId: string,
    token: string,
    extensions: Record<ResponseField, string> = {
      answer: 'md',
      assistantMessageId: 'txt',
    }
  ): void {
    // Do nothing
  }

  question(
    threadId: string,
    userMessageId: string,
    question: string,
    codeSelection: string | undefined,
    prompt: string | undefined,
    extensions: Record<QuestionField, string> = {
      question: 'txt',
      codeSelection: 'txt',
      prompt: 'md',
    }
  ): void {
    // Do nothing
  }

  load(threadId: string): Thread {
    throw new ThreadAccessError(threadId, 'load', new Error('Not implemented on Windows'));
  }
}
