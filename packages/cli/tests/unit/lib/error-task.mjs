import { parentPort } from 'worker_threads';

parentPort.on('message', async (task) => {
  throw new Error(task.errorMessage);
});
