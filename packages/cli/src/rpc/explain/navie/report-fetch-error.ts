import { warn } from 'console';
import { verbose } from '../../../utils';

const ENDPOINT_FAILURES_REPORTED = new Set<string>();

export default async function reportFetchError<T>(
  endpoint: string,
  remoteFunction: () => Promise<T>
): Promise<T | undefined> {
  // Wrap the error handling in its own error handler so that we don't inadvertently
  // blow up the request with bad error handling.
  function handleError(error: any) {
    try {
      let message: string;
      if (error instanceof Error) {
        message = error.message;
      } else {
        message = String(error);
      }
      const errorKey = [endpoint, message].join(' : ');
      if (!ENDPOINT_FAILURES_REPORTED.has(errorKey)) {
        warn(errorKey);
        if (verbose()) warn(error);
        ENDPOINT_FAILURES_REPORTED.add(errorKey);
      }
    } catch (handlingError) {
      warn(handlingError);
      warn(error);
    }
  }

  try {
    return await remoteFunction();
  } catch (error) {
    handleError(error);
    return undefined;
  }
}
