import { homedir } from 'os';
import History, { ThreadAccessError } from './history';
import Thread from './thread';
import { join } from 'path';
import { warn } from 'console';
import configuration from '../../configuration';

export function initializeHistory(): History {
  return new History(join(homedir(), '.appmap', 'navie', 'history'));
}

export async function loadThread(history: History, threadId: string): Promise<Thread> {
  let thread: Thread;

  try {
    thread = await history.load(threadId);
  } catch (e) {
    if (e instanceof ThreadAccessError) {
      warn(`[remote-navie] Creating new thread ${threadId} (thread not found)`);
      const projectDirectories = configuration().projectDirectories;
      thread = new Thread(threadId, Date.now(), projectDirectories);
    } else {
      throw e;
    }
  }

  return thread;
}
