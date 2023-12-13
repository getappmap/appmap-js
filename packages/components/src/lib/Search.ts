import { browserClient, reportError } from './RPC';

import { EventEmitter } from 'events';

export class Ask extends EventEmitter {
  client: any;

  constructor(client: any) {
    super();

    this.client = client;
  }

  ask(input: string, threadId?: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.client.request(
        'ask',
        { threadId, question: input },
        (err: any, error: any, response: { userMessageId: string; threadId: string }) => {
          if (err || error) return reportError(reject, err, error);

          this.pollForStatus(response.userMessageId);
          this.onAck(response.userMessageId, response.threadId);

          resolve(response.userMessageId);
        }
      );
    });
  }

  protected pollForStatus(userMessageId: string) {
    let numTokens = 0;

    const statusInterval = setInterval(() => {
      this.client.request(
        'ask.status',
        { userMessageId },
        (err: any, error: any, statusResponse: any) => {
          if (err || error) return reportError(this.onError.bind(this), err, error);

          this.emit('status', statusResponse);

          const explanation = statusResponse.explanation || [];
          const newTokenCount = explanation.length - numTokens;
          if (newTokenCount > 0) {
            const newTokens = explanation.slice(-newTokenCount);
            for (const token of newTokens) this.onToken(token, userMessageId);
          }
          numTokens = explanation.length;

          if (statusResponse.step === 'complete') {
            clearInterval(statusInterval);
            this.onComplete();
          }
        }
      );
    }, 1000);
  }

  protected onError(err: any) {
    this.emit('error', err);
  }

  protected onAck(userMessageId: string, threadId: string) {
    this.emit('ack', userMessageId, threadId);
  }

  protected onToken(token: string, messageId: string) {
    this.emit('token', token, messageId);
  }

  protected onComplete() {
    this.emit('complete');
  }
}

export default class Search {
  client: any;

  constructor(portOrClient: number | any) {
    this.client = typeof portOrClient === 'number' ? browserClient(portOrClient) : portOrClient;
  }

  ask(): Ask {
    return new Ask(this.client);
  }
}
