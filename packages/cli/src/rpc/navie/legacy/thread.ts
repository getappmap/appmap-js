import { warn } from 'console';
import { ExplainRpc } from '@appland/rpc';

export type Message = ExplainRpc.Message;
export type Question = ExplainRpc.Question;
export type Answer = ExplainRpc.Answer;

export class Exchange {
  readonly question: Question;
  answer?: Answer;

  constructor(
    timestamp: number,
    messageId: string,
    question: string,
    codeSelection?: string,
    prompt?: string
  ) {
    this.question = {
      timestamp,
      messageId,
      content: question,
      role: 'user',
      codeSelection,
      prompt,
    };
  }

  setAnswer(messageId: string, answer: string) {
    this.answer = {
      messageId,
      content: answer,
      role: 'assistant',
    };
  }
}

export type ThreadData = ExplainRpc.Thread;

export default class LegacyThread implements ThreadData {
  public readonly exchanges: Exchange[] = [];

  public constructor(
    public readonly threadId: string,
    public readonly timestamp: number,
    public readonly projectDirectories: string[]
  ) {}

  get messages(): Message[] {
    const result = new Array<Message>();
    for (const exchange of this.exchanges) {
      result.push(exchange.question);
      if (exchange.answer) result.push(exchange.answer);
    }
    return result;
  }

  /**
   * Gets the thread timestamp formatted as 'YYYY-mm-dd'.
   */
  date() {
    const date = new Date(this.timestamp);
    return date.toISOString().split('T')[0];
  }

  question(
    timestamp: number,
    messageId: string,
    question: string,
    codeSelection?: string,
    prompt?: string
  ) {
    const exchange = new Exchange(timestamp, messageId, question, codeSelection, prompt);
    this.exchanges.push(exchange);
  }

  answer(userMessageId: string, messageId: string, answer: string) {
    const exchange = this.exchanges[this.exchanges.length - 1];
    if (!exchange) {
      warn(`[history/thread] No question to answer for message ${messageId}`);
      return;
    }
    if (exchange.question.messageId !== userMessageId) {
      warn(`[history/thread] Received an answer to a different question than the last one asked`);
      return;
    }
    exchange.setAnswer(messageId, answer);
  }

  asJSON(): ThreadData {
    return {
      timestamp: this.timestamp,
      projectDirectories: this.projectDirectories,
      exchanges: this.exchanges,
    };
  }

  static fromJSON(threadId: string, data: ThreadData): LegacyThread {
    const thread = new LegacyThread(threadId, data.timestamp, data.projectDirectories);
    for (const exchange of data.exchanges) {
      thread.question(
        exchange.question.timestamp,
        exchange.question.messageId,
        exchange.question.content,
        exchange.question.codeSelection,
        exchange.question.prompt
      );
      if (exchange.answer)
        thread.answer(
          exchange.question.messageId,
          exchange.answer.messageId,
          exchange.answer.content
        );
    }
    return thread;
  }
}
