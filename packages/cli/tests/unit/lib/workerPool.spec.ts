import { join } from 'path';
import WorkerPool from '../../../src/lib/workerPool';

type SumTask = {
  a: number;
  b: number;
  delay: number;
};

type TaskResult = {
  errors: Error[];
  sums: number[];
  elapsed: number;
};

describe('WorkerPool', () => {
  let numThreads = 1;
  let delay = 100;
  let jobFile = join(__dirname, 'delay-sum.mjs');
  let workerPool: WorkerPool;

  const initializeWorkerPool = () => (workerPool = new WorkerPool(jobFile, numThreads));

  const runTasks = async (tasks: SumTask[]): Promise<TaskResult> => {
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

  it('processes a simple task using MJS', async () => {
    initializeWorkerPool();

    const task = { a: 1, b: 2, delay };
    const result = await runTasks([task]);

    expect(result.sums).toEqual([3]);
    expect(result.elapsed).toBeGreaterThanOrEqual(delay);
    expect(result.elapsed).toBeLessThan(delay * 1.5);
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
    expect(result.elapsed).toBeLessThan(delay * 3);
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
      expect(result.elapsed).toBeLessThan(delay * 1.5);
    });
  });
});
