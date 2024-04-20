import { warn } from 'console';
import { findFiles } from '../utils';
import WorkerPool from './workerPool';
import assert from 'assert';

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
  errors: Error[];
  unhandledErrors: Error[];
  numProcessed: number;
};

export default async function processAppMapDir<T extends Task, V>(
  name: string,
  pool: WorkerPool,
  taskFunction: TaskFunction<T>,
  appmapDir?: string,
  appmapFiles?: string[],
  resultHandler?: TaskResultHandler<TaskResult<V>>
): Promise<ProcessResult> {
  console.log([name, '...'].join(''));

  let files: string[];
  if (appmapFiles) {
    files = appmapFiles;
  } else {
    assert(appmapDir, 'appmapDir must be specified if appmapFiles is not specified');
    files = await findFiles(appmapDir, '.appmap.json');
  }

  const oversized = new Set<string>();
  const unhandledErrors = new Array<Error>();
  const errors = new Array<Error>();
  await Promise.all(
    files.map(
      async (file) =>
        new Promise<void>((resolve) =>
          pool.runTask(taskFunction(file), async (err: Error | null, result: TaskResult<V>) => {
            if (err) {
              warn(`Unhandled error: ${err}`);
              unhandledErrors.push(err);
              errors.push(err);
            } else if (result.oversized) {
              warn(`Skipping oversized AppMap ${file}`);
              oversized.add(file);
            } else if (result.error) {
              warn(`${name} failed to process ${file}: ${result.error}`);
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

  return { oversized, errors, unhandledErrors, numProcessed: files.length };
}
