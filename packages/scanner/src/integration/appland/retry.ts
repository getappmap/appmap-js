import { IncomingMessage } from 'http';
import { RetryOptions } from './retryOptions';
import {
  RejectFunction,
  RetryHandler,
  ResolveFunction,
} from '@appland/client/dist/src/retryHandler';

const RetryDelay = 1000;
const MaxRetries = 3;

export default function retry(
  retryFn: () => Promise<IncomingMessage>,
  retryOptions?: RetryOptions
): RetryHandler {
  let retryCount = 0;
  const retryDelay = retryOptions?.retryDelay ?? RetryDelay;
  const maxRetries = retryOptions?.maxRetries ?? MaxRetries;

  return (resolve: ResolveFunction, reject: RejectFunction): void => {
    retryCount += 1;
    // console.warn(retryCount);
    if (retryCount > maxRetries) {
      reject(new Error('Unable to create AppMap: Max retries exceeded.'));
    }
    setTimeout(() => retryFn().then(resolve).catch(reject), retryDelay * retryCount * retryCount);
  };
}
