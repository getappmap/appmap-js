import { UserContext } from '@appland/navie';
import Thread from './thread';

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

export default interface IHistory {
  readonly directory: string;

  token(
    threadId: string,
    userMessageId: string,
    assistantMessageId: string,
    token: string,
    extensions?: Record<ResponseField, string>
  ): void | Promise<void>;

  question(
    threadId: string,
    userMessageId: string,
    question: string,
    codeSelection: UserContext.Context | undefined,
    prompt: string | undefined,
    extensions?: Record<QuestionField, string>
  ): void | Promise<void>;

  load(threadId: string): Thread | Promise<Thread>;
}
