import { buildAppMap } from '@appland/models';
import { readFile } from 'fs/promises';
import { parentPort } from 'worker_threads';

parentPort.on('message', async (task) => {
  const { appmapFile } = task;
  const appmap = buildAppMap()
    .source(await readFile(appmapFile, 'utf-8'))
    .build();
  parentPort.postMessage({ events: appmap.events.length ?? 0 });
});
