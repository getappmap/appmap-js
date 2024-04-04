import { parentPort } from 'worker_threads';

parentPort.on('message', async () => {
  throw new Error('Here comes an unhandled error');
});
