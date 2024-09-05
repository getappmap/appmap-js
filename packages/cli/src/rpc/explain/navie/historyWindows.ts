import { ThreadAccessError } from './ihistory';
import IHistory from './ihistory';
import Thread from './thread';

export default class HistoryWindows implements IHistory {
  constructor(public readonly directory: string) {
    console.warn('History is currently disabled. It is not yet implemented on Windows.');
  }

  token(): void {
    // Do nothing
  }

  question(): void {
    // Do nothing
  }

  load(threadId: string): Thread {
    throw new ThreadAccessError(threadId, 'load', new Error('Not implemented on Windows'));
  }
}
