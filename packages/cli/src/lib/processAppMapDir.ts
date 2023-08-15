import { warn } from 'console';
import { findFiles } from '../utils';
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

export type TaskResultHandler<V> = (appmapFile: string, result: V) => void | Promise<void>;

export type ProcessResult = {
  oversized: Set<string>;
  errors: Array<Error>;
  numProcessed: number;
};

export default async function processAppMapDir<T extends Task, V>(
  name: string,
  pool: WorkerPool,
  taskFunction: TaskFunction<T>,
  appmapDir: string,
  resultHandler?: TaskResultHandler<TaskResult<V>>
): Promise<ProcessResult> {
  console.log([name, '...'].join(''));

  const files = await findFiles(appmapDir, '.appmap.json');

  const oversized = new Set<string>();
  const errors = new Array<Error>();
  await Promise.all(
    files.map(
      async (file) =>
        new Promise<void>((resolve, reject) =>
          pool.runTask(taskFunction(file), async (err: Error | null, result: TaskResult<V>) => {
            if (err) return reject(err);

            if (result.oversized) {
              warn(`Skipping oversized AppMap ${file}`);
              oversized.add(file);
            } else if (result.error) {
              warn(`${name} failed to process ${file}: ${(result.error as Error).message}`);
              errors.push(result.error);
            } else {
              if (resultHandler) {
                try {
                  await resultHandler(file, result);
                } catch (err) {
                  warn(
                    `${name} failed to handle processed result from ${file}: ${
                      (err as Error).message
                    }`
                  );
                }
              }
            }

            resolve();
          })
        )
    )
  );

  return { oversized, errors, numProcessed: files.length };
}
