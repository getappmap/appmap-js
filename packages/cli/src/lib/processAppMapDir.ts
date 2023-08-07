import { warn } from 'console';
import { listAppMapFiles } from '../utils';
import WorkerPool from './workerPool';

export type Task = {
  verbose: boolean;
  appmapFile: string;
};

export type TaskResult<V> = {
  oversized?: boolean;
  error?: Error;
  result: V;
};

export type TaskFunction<T extends Task> = (appmapFile: string) => T;

export type TaskResultHandler<V> = (appmapFile: string, result: V) => Promise<void>;

export default async function processAppMapDir<T extends Task, V>(
  name: string,
  pool: WorkerPool,
  taskFunction: TaskFunction<T>,
  appmapDir: string,
  resultHandler: TaskResultHandler<V>
): Promise<void> {
  const files = new Array<string>();
  await listAppMapFiles(appmapDir, (file) => files.push(file));

  await Promise.all(
    files.map(
      async (file) =>
        new Promise<void>((resolve, reject) =>
          pool.runTask(taskFunction(file), async (err: Error | null, result: TaskResult<V>) => {
            if (err) return reject(err);

            if (result.oversized) {
              warn(`Skipping oversized AppMap ${file}`);
              return resolve();
            }
            if (result.error) {
              warn(`${name} failed to process ${file}: ${(result.error as Error).message}`);
              return resolve();
            }

            try {
              await resultHandler(file, result.result);
            } catch (err) {
              warn(
                `${name} failed to handle processed result from ${file}: ${(err as Error).message}`
              );
            }

            resolve();
          })
        )
    )
  ).finally(() => pool.close());
}
