import { join } from 'path';
import Thread from './thread';
import { mkdir, readdir, readFile, readlink, rm, symlink, writeFile } from 'fs/promises';
import { warn } from 'console';
import { Message } from '@appland/navie';
import { exists } from '../../../utils';
import { OpenMode } from 'fs';
import configuration from '../../configuration';

export const THREAD_ID_REGEX = /^[0-9a-f]{4,16}(-[0-9a-f]{4,16}){3,6}$/;

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

export enum QuestionField {
  Question = 'question',
  CodeSelection = 'codeSelection',
  Prompt = 'prompt',
}

export enum ResponseField {
  AssistantMessageId = 'assistantMessageId',
  Answer = 'answer',
}

type SequenceFile = { timestamp: number; messageId: string };

const parseSequenceFile = (dir: string): SequenceFile => ({
  timestamp: parseInt(dir.split('.')[0]),
  messageId: dir.split('.')[1],
});

export default class History {
  private firstResponse = new Map<string, number>();

  public constructor(public readonly directory: string) {}

  async question(
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
  ) {
    const threadDir = await this.ensureThreadDir(threadId);
    const messageDir = await History.findOrCreateMessageDir(threadDir, userMessageId);

    const writeMessageFile = async (field: QuestionField, content: string) => {
      const messageFile = join(messageDir, [field, extensions[field]].join('.'));
      await writeFile(messageFile, content);

      const sequenceDir = join(threadDir, 'sequence');
      await mkdir(sequenceDir, { recursive: true });
      const sequenceFile = join(
        sequenceDir,
        [Date.now().toString(), field, extensions[field]].join('.')
      );
      await History.createSymlinkIfNotExists(
        join('..', 'messages', userMessageId, [field, extensions[field]].join('.')),
        sequenceFile
      );
    };

    await writeMessageFile(QuestionField.Question, question);
    if (codeSelection) await writeMessageFile(QuestionField.CodeSelection, codeSelection);
    if (prompt) await writeMessageFile(QuestionField.Prompt, prompt);

    const date = new Date().toISOString().split('T')[0];
    const dateDir = join(this.directory, 'dates', date);
    await mkdir(dateDir, { recursive: true });
    const dateThreadFile = join(dateDir, threadId);
    await History.createSymlinkIfNotExists(threadDir, dateThreadFile);
  }

  async token(
    threadId: string,
    userMessageId: string,
    assistantMessageId: string,
    token: string,
    extensions: Record<ResponseField, string> = {
      answer: 'md',
      assistantMessageId: 'txt',
    }
  ) {
    const threadDir = await this.ensureThreadDir(threadId);
    const messageDir = await History.findOrCreateMessageDir(threadDir, userMessageId);
    const timestamp = Date.now();

    const writeMessageFile = async (
      field: ResponseField,
      content: string,
      modeFlag: { flag: OpenMode | undefined } = { flag: 'w' }
    ) => {
      const messageFile = join(messageDir, [field, extensions[field]].join('.'));
      await writeFile(messageFile, content, modeFlag);

      const sequenceDir = join(threadDir, 'sequence');
      await mkdir(sequenceDir, { recursive: true });
      const sequenceFile = join(sequenceDir, [timestamp, field, extensions[field]].join('.'));
      await History.createSymlinkIfNotExists(
        join('..', 'messages', userMessageId, [field, extensions[field]].join('.')),
        sequenceFile
      );
    };

    if (!this.firstResponse.has(assistantMessageId)) {
      this.firstResponse.set(assistantMessageId, timestamp);

      await writeMessageFile(ResponseField.AssistantMessageId, assistantMessageId);
      await writeMessageFile(ResponseField.Answer, token, { flag: 'a' });
    } else {
      const messageFile = join(
        messageDir,
        [ResponseField.Answer, extensions[ResponseField.Answer]].join('.')
      );
      await writeFile(messageFile, token, { flag: 'a' });
    }
  }

  async load(threadId: string): Promise<Thread> {
    const threadDir = join(this.directory, 'threads', threadId);
    let projectDirectories: string[];
    try {
      projectDirectories = (await readFile(join(threadDir, 'projectDirectories.txt'), 'utf-8'))
        .split('\n')
        .filter(Boolean);
    } catch (e) {
      throw History.threadAccessError(threadId, 'load', e);
    }

    const messagesDir = join(this.directory, 'threads', threadId, 'messages');
    const sequenceDir = join(this.directory, 'threads', threadId, 'sequence');

    let messageSequenceFiles: string[];
    try {
      messageSequenceFiles = await readdir(sequenceDir);
    } catch (e) {
      throw History.threadAccessError(threadId, 'load', e);
    }

    messageSequenceFiles.sort(
      (a, b) => parseSequenceFile(a).timestamp - parseSequenceFile(b).timestamp
    );
    const contentFileFieldName = (contentFile: string) => contentFile.split('.')[0];

    const timestamp =
      messageSequenceFiles.length > 0
        ? parseSequenceFile(messageSequenceFiles[0]).timestamp
        : Date.now();
    const thread = new Thread(threadId, timestamp, projectDirectories);

    const userMessageIds = new Set<string>();
    for (const sequenceFile of messageSequenceFiles) {
      const sequenceFilePath = join(sequenceDir, sequenceFile);
      // Resolve the file name that the symlink points to.
      let messageFile: string;
      try {
        messageFile = await readlink(sequenceFilePath);
      } catch (e) {
        warn(e);
        continue;
      }
      const messageFileTokens = messageFile.split('/');
      const userMessageId = messageFileTokens[messageFileTokens.length - 2];
      userMessageIds.add(userMessageId);
    }

    for (const userMessageId of userMessageIds) {
      const contentFiles = await readdir(join(messagesDir, userMessageId));
      let threadTimestamp: number | undefined;

      const readRecordFile = async (recordName: string): Promise<string | undefined> => {
        const matchingContentFile = contentFiles.find(
          (file) => contentFileFieldName(file) === recordName
        );
        if (!matchingContentFile) return undefined;

        const contentFile = join(messagesDir, userMessageId, matchingContentFile);

        // Read the file timestamp to use as the thread timestamp.
        try {
          const contentFileStat = await readFile(contentFile, 'utf-8');
          const messageTimestamp = parseInt(contentFileStat.split('.')[0]);
          if (!threadTimestamp || messageTimestamp < threadTimestamp)
            threadTimestamp = messageTimestamp;
        } catch (e) {
          throw History.threadAccessError(threadId, 'read', e);
        }

        try {
          return await readFile(contentFile, 'utf-8');
        } catch (e) {
          throw History.threadAccessError(threadId, 'read', e);
        }
      };

      const question = await readRecordFile('question');
      const codeSelection = await readRecordFile('codeSelection');
      const prompt = await readRecordFile('prompt');
      const assistantMessageId = await readRecordFile('assistantMessageId');
      const answer = await readRecordFile('answer');

      if (userMessageId && question)
        thread.question(
          threadTimestamp ?? Date.now(),
          userMessageId,
          question,
          codeSelection,
          prompt
        );
      if (userMessageId && assistantMessageId && answer) {
        thread.answer(userMessageId, assistantMessageId, answer);
      }
    }

    return thread;
  }

  // Message are stored within threadDir/message in subdirectories. Each subdirectory is named
  // by joining the timestamp and the user message id with a period. This naming convention
  // makes it easy to view and sort the messages in chronological order.
  private static async findOrCreateMessageDir(
    threadDir: string,
    userMessageId: string
  ): Promise<string> {
    // List message directories in the thread directory.
    const messagesDir = join(threadDir, 'messages');
    await mkdir(messagesDir, { recursive: true });

    let messageIds: string[];
    try {
      messageIds = await readdir(messagesDir);
    } catch (e) {
      throw this.threadAccessError(threadDir, 'initialize storage for', e);
    }

    // Find the message directory for the user message.
    if (messageIds.includes(userMessageId)) {
      return join(messagesDir, userMessageId);
    }

    const messagePath = join(messagesDir, userMessageId);
    await mkdir(messagePath, { recursive: true });
    return messagePath;
  }

  private static async createSymlinkIfNotExists(target: string, path: string) {
    try {
      await readlink(path);
    } catch (e) {
      const err = e as Error & { code?: string };
      if (err.code === 'ENOENT') {
        await symlink(target, path);
      } else if (err.code === 'EEXIST') {
        // Symlink already exists, do nothing.
      } else {
        throw err;
      }
    }
  }

  private async ensureThreadDir(threadId: string): Promise<string> {
    const threadDir = join(this.directory, 'threads', threadId);
    await mkdir(threadDir, { recursive: true });
    const projectDirectoriesFile = join(threadDir, 'projectDirectories.txt');
    if (!(await exists(projectDirectoriesFile))) {
      const projectDirectories = configuration().projectDirectories;
      await writeFile(projectDirectoriesFile, projectDirectories.join('\n'));
    }
    return threadDir;
  }

  static threadAccessError(threadId: string, action: string, e: any): ThreadAccessError {
    const err = e as Error & { code?: string };
    if (err.code === 'ENOENT') warn(`Thread ${threadId} not found`);

    return new ThreadAccessError(threadId, action, e instanceof Error ? e : undefined);
  }

  // In the old-style history format, threads are stored in files named by their thread id
  // and timestamp. In the new-style history format, threads are stored in files named by
  // their thread id, and the thread file is symlinked to a file named for the date of the thread.
  static async migrate(
    oldDirectory: string,
    history: History,
    options: { cleanup: boolean } = { cleanup: true }
  ): Promise<void> {
    // List the contents of the old directory. Each one is a threadId directory, containing
    // timestamped messages.
    const threadIds = (await readdir(oldDirectory)).filter(
      // Match UUIDs like 5278527e-c4ed-4e45-9fb6-372ed6a036f6 in the thread dir
      // Being careful not to touch anything else, like the dates and threads directories that are
      // created in the new history format.
      (dir) => dir.match(THREAD_ID_REGEX)
    );

    const threadFileAsTimestamp = (threadFile: string) => parseInt(threadFile.split('.')[0]);

    for (const threadId of threadIds) {
      warn(`[history] Migrating thread ${threadId} from old history format`);

      const oldThreadDir = join(oldDirectory, threadId);
      const threadFiles = await readdir(oldThreadDir);
      threadFiles.sort((a, b) => threadFileAsTimestamp(a) - threadFileAsTimestamp(b));

      let lastUserMessageId: string | undefined;
      for (const threadFile of threadFiles) {
        const timestamp = threadFileAsTimestamp(threadFile);
        // MessageIds are not available, so fake them with timestamps.
        const messageId = timestamp.toString();
        const messageFile = join(oldThreadDir, threadFile);
        const messageStr = await readFile(messageFile, 'utf-8');
        const message = JSON.parse(messageStr) as Message;
        if (message.role === 'user') {
          lastUserMessageId = messageId;
          // codeSelection and prompt are not available in the old format.
          await history.question(threadId, messageId, message.content, undefined, undefined);
        } else if (message.role === 'assistant' || message.role === 'system') {
          if (lastUserMessageId)
            await history.token(threadId, lastUserMessageId, messageId, message.content);
        }

        // Project directories are unknown, so overwrite the file contents with empty text.
        const newThreadDir = join(history.directory, 'threads', threadId);
        if (await exists(newThreadDir)) await writeFile(join(newThreadDir, 'projectDirectories.txt'), '');
      }

      if (options.cleanup) await rm(oldThreadDir, { recursive: true });
    }
  }
}
