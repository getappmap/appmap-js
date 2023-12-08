import { browserClient, reportError } from './RPC';

import { SearchRpc } from '@appland/rpc';
import { EventEmitter } from 'events';

export class Ask extends EventEmitter {
  client: any;

  constructor(client: any) {
    super();

    this.client = client;
  }

  ask(input: string, threadId?: string): Promise<string> {
    // eslint-disable-next-line no-param-reassign
    threadId ||= Math.random().toString(36).substring(2, 15);

    return new Promise<string>((resolve, reject) => {
      this.client.request(
        'ask',
        { threadId, question: input },
        (err: any, error: any, requestId: string) => {
          if (err || error) return reportError(reject, err, error);

          this.pollForStatus(requestId);
          this.onAck(requestId, threadId!);

          resolve(requestId);
        }
      );
    });
  }

  protected pollForStatus(requestId: string) {
    const statusInterval = setInterval(() => {
      this.client.request(
        'ask.status',
        { requestId },
        (err: any, error: any, statusResponse: any) => {
          if (err || error) return reportError(this.onError.bind(this), err, error);

          this.emit('status', statusResponse);
          if (statusResponse.step === 'complete') {
            clearInterval(statusInterval);
            this.onToken(statusResponse.explanation, requestId);
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
