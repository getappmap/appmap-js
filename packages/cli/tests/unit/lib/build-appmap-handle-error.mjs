import { buildAppMap } from '@appland/models';
import { warn } from 'console';
import { readFile } from 'fs/promises';
import { parentPort } from 'worker_threads';

parentPort.on('message', async (task) => {
  const { appmapFile } = task;
  try {
    const appmap = buildAppMap()
      .source(await readFile(appmapFile, 'utf-8'))
      .build();
    parentPort.postMessage({ events: appmap.events.length ?? 0 });
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
