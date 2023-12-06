import { browserClient, reportError } from './RPC';

import { AICallbacks } from '@appland/client';
import { SearchRpc } from '@appland/rpc';

export default class SearchClient {
  client: any;

  constructor(port: number, private readonly callbacks: AICallbacks) {
    this.client = browserClient(port);
  }

  ask(threadId: string, input: string): void {
    // eslint-disable-next-line no-param-reassign
    if (!threadId) threadId ||= Math.random().toString(36).substring(2, 15);

    const { callbacks } = this;
    const messageId = Math.random().toString(36).substring(2, 15);

    this.client.request('ask', { threadId, question: input }, function (err, error, result) {
      if (err || error) return reportError(callbacks.onError, err, error);

      if (callbacks.onAck) callbacks.onAck(messageId, threadId);

      const explanation = result as string;
      callbacks.onToken(explanation, messageId);
      callbacks.onComplete();
    });
  }

  async searchResults(): Promise<SearchRpc.SearchResponse> {
    return new Promise((resolve, reject) => {
      this.client.request('searchResults', {}, function (err, error, result) {
        if (err || error) return reportError(reject, err, error);

        resolve(result as SearchRpc.SearchResponse);
      });
    });
  }
}
