import { join } from 'path';
import WorkerPool from '../../../src/lib/workerPool';

type TaskResult = {
  errors: Error[];
  sums: number[];
  elapsed: number;
};

describe('WorkerPool', () => {
  let numThreads = 1;
  let delay = 100;
  let workerPool: WorkerPool;
  let jobFile: string;

  const initializeWorkerPool = () => (workerPool = new WorkerPool(jobFile, numThreads));

  const runTasks = async <T>(tasks: Array<T>): Promise<TaskResult> => {
    const processTasks = async (cb: (err: Error | null, result: any) => void) => {
      await Promise.all(
        tasks.map((task) => {
          return new Promise<void>((resolve) => {
            workerPool.runTask(task, (err, result) => {
              cb(err, result);

              resolve();
            });
          });
        })
      );
    };

    // Run once to warm up the worker pool
    await processTasks(() => undefined);

    // Run again for timing
    const errors = new Array<Error>();
    const sums = new Array<number>();
    const startTime = new Date();

    await processTasks((err, result) => {
      if (err) errors.push(err);
      else sums.push(result);
    });

    const endTime = new Date();
    const elapsed = endTime.getTime() - startTime.getTime();
    return { errors, sums, elapsed };
  };

  afterEach(async () => (workerPool ? await workerPool.close() : undefined));

  describe('performing a fixed-time task', () => {
    beforeEach(() => (jobFile = join(__dirname, 'delay-sum-task.mjs')));

    it('completes the task', async () => {
      initializeWorkerPool();

      const task = { a: 1, b: 2, delay };
      const result = await runTasks([task]);

      expect(result.sums).toEqual([3]);
      expect(result.elapsed).toBeGreaterThanOrEqual(delay);
    });

    it('takes 2x the delay time using one worker', async () => {
      initializeWorkerPool();

      const tasks = [
        { a: 1, b: 1, delay },
        { a: 2, b: 2, delay },
      ];
      const result = await runTasks(tasks);

      expect(result.sums.sort((a, b) => a - b)).toEqual([2, 4]);
      expect(result.elapsed).toBeGreaterThanOrEqual(delay * 2);
    });

    describe('using two workers', () => {
      beforeEach(() => (numThreads = 2));

      it('takes about 1x the delay time', async () => {
        initializeWorkerPool();

        const tasks = [
          { a: 1, b: 1, delay },
          { a: 2, b: 2, delay },
        ];
        const result = await runTasks(tasks);

        expect(result.sums.sort((a, b) => a - b)).toEqual([2, 4]);
        expect(result.elapsed).toBeGreaterThanOrEqual(delay);
      });
    });
  });

  describe('when the task raises an error', () => {
    beforeEach(() => (jobFile = join(__dirname, 'error-task.mjs')));

    it('re-raises the error', async () => {
      initializeWorkerPool();

      const task = { errorMessage: 'an error occurred' };
      const result = await runTasks([task]);

      expect(result.errors.map((e) => e.toString())).toEqual(['Error: an error occurred']);
      expect(result.sums).toEqual([]);
    });
  });
});
