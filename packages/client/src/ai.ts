import { Observable } from 'rxjs';
import { ServiceEndpoint } from './configuration';
import buildRequest from './buildRequest';

type StreamResponse = {
  threadId: string;
  userMessageId: string;
  systemMessageId: string;
  response: Observable<string>;
};

// eslint-disable-next-line unicorn/no-static-only-class
export default class AI {
  static async conversation(input: string, threadId?: string): Promise<StreamResponse> {
    const requestBuilder = buildRequest('v1/ai/conversation', {
      service: ServiceEndpoint.ServiceApi,
      requireApiKey: true,
    });

    const body = JSON.stringify({ input, threadId });
    const response = await fetch(requestBuilder.url.toString(), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...requestBuilder.headers,
      },
      body,
    });

    if (!response.body) {
      throw new Error('Received an empty response');
    }

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    return {
      response: new Observable<string>((subscriber) => {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        setImmediate(async () => {
          for (;;) {
            // eslint-disable-next-line no-await-in-loop
            const { value, done } = await reader.read();
            if (done) break;
            subscriber.next(value);
          }

          subscriber.complete();
        });
      }),
      threadId: response.headers.get('X-Thread-ID') || '',
      userMessageId: response.headers.get('x-user-message-id') || '',
      systemMessageId: response.headers.get('x-system-message-id') || '',
    };
  }
}
