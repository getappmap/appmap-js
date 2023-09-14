import { parentPort } from 'worker_threads';

parentPort.on('message', async (task) => {
  setTimeout(() => parentPort.postMessage(task.a + task.b), task.delay);
});
