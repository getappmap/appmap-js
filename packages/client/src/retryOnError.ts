import { RejectFunction, ResolveFunction, RetryHandler } from './retryHandler';

type SystemError = {
  code: string;
};

export default function retryOnError(
  retryHandler: RetryHandler,
  resolve: ResolveFunction,
  reject: RejectFunction
): (error: Error) => void {
  return (error: Error): void => {
    const { code } = error as unknown as SystemError;
    if (['EPIPE', 'ECONNRESET'].includes(code)) {
      retryHandler(resolve, reject);
      return;
    }

    reject(error);
  };
}
