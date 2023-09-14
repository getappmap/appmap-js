import { readFile } from 'fs/promises';
import { parentPort } from 'worker_threads';

parentPort.on('message', async (task) => {
  const { appmapFile } = task;
  const appmap = JSON.parse(await readFile(appmapFile, 'utf-8'));
  parentPort.postMessage({ events: appmap.events.length ?? 0 });
});
