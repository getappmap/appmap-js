import { browserClient, reportError } from './RPC';

import { SearchRpc } from '@appland/rpc';
import { EventEmitter } from 'events';

export class Ask extends EventEmitter {
  client: any;

  constructor(client: any) {
    super();

    this.client = client;
  }

  ask(input: string, threadId?: string): void {
    // eslint-disable-next-line no-param-reassign
    threadId ||= Math.random().toString(36).substring(2, 15);

    const messageId = Math.random().toString(36).substring(2, 15);
    this.client.request(
      'ask',
      { threadId, question: input },
      (err: any, error: any, explanation: string) => {
        if (err || error) return reportError(this.onError.bind(this), err, error);

        this.onAck(messageId, threadId!);
        this.onToken(explanation, messageId);
        this.onComplete();
      }
    );
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

  async searchResults(): Promise<SearchRpc.SearchResponse> {
    return new Promise((resolve, reject) => {
      this.client.request(
        'searchResults',
        {},
        function (err: any, error: any, result: SearchRpc.SearchResponse) {
          if (err || error) return reportError(reject, err, error);

          resolve(result as SearchRpc.SearchResponse);
        }
      );
    });
  }
}
