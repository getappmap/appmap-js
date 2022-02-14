import { RejectFunction, ResolveFunction, RetryHandler } from './retryHandler';

export default function retryOnError(
  retryHandler: RetryHandler,
  resolve: ResolveFunction,
  reject: RejectFunction
): (error: Error) => void {
  return (error: Error): void => {
    const { code } = error as never;
    if (['EPIPE', 'ECONNRESET'].includes(code)) {
      // console.warn(code);
      retryHandler(resolve, reject);
      return;
    }

    reject(error);
  };
}
