import { warn } from 'console';
import { parentPort } from 'worker_threads';

parentPort.on('message', async () => {
  try {
    throw new Error('Handle this error');
  } catch (err) {
    let errorMessage;
    try {
      errorMessage = err.toString();
    } catch {
      warn(err);
      warn(`Unable to convert error to string`);
      errorMessage = 'unknown error';
    }
    parentPort.postMessage({ error: errorMessage });
  }
});
