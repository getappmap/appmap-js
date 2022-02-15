import { IncomingMessage } from 'http';
import { RetryOptions } from './retryOptions';
import {
  RejectFunction,
  RetryHandler,
  ResolveFunction,
} from '@appland/client/dist/src/retryHandler';
import { verbose } from '../../rules/lib/util';

const RetryDelay = 500;
const MaxRetries = 3;

export default function retry(
  description: string,
  retryOptions: RetryOptions,
  retryFn: () => Promise<IncomingMessage>
): RetryHandler {
  const maxRetries = retryOptions.maxRetries ?? MaxRetries;
  const retryDelay = retryOptions.retryDelay ?? RetryDelay;

  let retryCount = 0;

  function computeDelay(): number {
    return retryDelay * Math.pow(2, retryCount - 1);
  }

  return (resolve: ResolveFunction, reject: RejectFunction): void => {
    retryCount += 1;
    if (retryCount > maxRetries) {
      reject(new Error(`${description} failed: Max retries exceeded.`));
    }
    if (verbose()) {
      console.log(`Retrying ${description} in ${computeDelay()}ms`);
    }
    setTimeout(() => retryFn().then(resolve).catch(reject), computeDelay());
  };
}
