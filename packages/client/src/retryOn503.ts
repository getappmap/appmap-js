import { IncomingMessage } from 'http';
import { RetryHandler } from '.';

export default function retry(
  retryHandler: RetryHandler
): (response: IncomingMessage) => Promise<IncomingMessage> {
  return (response: IncomingMessage): Promise<IncomingMessage> => {
    return new Promise((resolve, reject) => {
      if (response.statusCode === 503) {
        retryHandler(resolve, reject);
        return;
      }

      resolve(response);
    });
  };
}
