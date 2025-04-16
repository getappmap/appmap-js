// Direct from the Node.js docs
// https://nodejs.org/api/async_context.html#using-asyncresource-for-a-worker-thread-pool

import { AsyncResource } from 'async_hooks';
import { EventEmitter } from 'events';
import { Worker } from 'worker_threads';
import assert from 'assert';
import { warn } from 'console';
import { verbose } from '../utils';
import { isNativeError } from 'util/types';

const kTaskInfo = Symbol('kTaskInfo');
const kWorkerFreedEvent = Symbol('kWorkerFreedEvent');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CallbackFn<R = any> = (err: Error | null, result: R) => void;

type Task = {
  task: any;
  callback: CallbackFn;
};

class WorkerPoolTaskInfo extends AsyncResource {
  constructor(public callback: CallbackFn) {
    super('WorkerPoolTaskInfo');
  }

  done(err: Error, result: any) {
    this.runInAsyncScope(this.callback, null, err, result);
    this.emitDestroy(); // `TaskInfo`s are used only once.
  }
}

export const DEFAULT_ADD_WORKER_DELAY = 5000;

type WorkerInfo = {
  created: Date;
  firstTask?: Date;
};

export default class WorkerPool extends EventEmitter {
  workers: Worker[] = [];
  freeWorkers: Worker[] = [];
  tasks: Task[] = [];
  workerInfoByThreadId = new Map<number, WorkerInfo>();

  addWorkerInterval?: NodeJS.Timeout | undefined;

  constructor(
    public taskFile: string | URL,
    public numThreads: number,
    public addWorkerDelay = DEFAULT_ADD_WORKER_DELAY
  ) {
    super();

    this.addNewWorker();
    if (numThreads > 1) this.addNewWorker();
    if (numThreads > 2) {
      this.addWorkerInterval = setInterval(() => {
        this.addNewWorker();

        if (this.addWorkerInterval && this.workers.length === numThreads)
          clearInterval(this.addWorkerInterval);
      }, addWorkerDelay);
      this.addWorkerInterval.unref();
    }

    const nextTask = (): Task => {
      const task = this.tasks.shift();
      assert(task);
      return task;
    };

    // Any time the kWorkerFreedEvent is emitted, dispatch
    // the next task pending in the queue, if any.
    this.on(kWorkerFreedEvent, () => {
      if (this.tasks.length > 0) {
        const { task, callback } = nextTask();
        this.runTask(task, callback);
      }
    });
  }

  runTask<T = unknown, R = unknown>(task: T, callback: CallbackFn<R>) {
    if (this.freeWorkers.length === 0) {
      // No free threads, wait until a worker thread becomes free.
      this.tasks.push({ task, callback });
      return;
    }

    const worker = this.freeWorkers.pop();
    assert(worker);
    worker[kTaskInfo] = new WorkerPoolTaskInfo(callback);
    if (verbose()) warn(`Assigning ${JSON.stringify(task)} to worker thread ${worker.threadId}`);
    worker.ref();
    worker.postMessage(task);
  }

  /**
   * Wait until all tasks are done.
   */
  async drain() {
    while (this.tasks.length > 0 || this.workers.length != this.freeWorkers.length) {
      await new Promise((resolve) => {
        this.once(kWorkerFreedEvent, resolve);
      });
    }
  }

  async close() {
    if (this.addWorkerInterval) clearInterval(this.addWorkerInterval);

    // Average time between worker creation and first task assignment
    const averageTimeToFirstTask =
      Array.from(this.workerInfoByThreadId.values())
        .filter((info) => info.firstTask)
        .map((info) => info.firstTask!.getTime() - info.created.getTime())
        .reduce((sum, time) => sum + time, 0) / this.workerInfoByThreadId.size;
    if (verbose())
      warn(`Worker average time to first task completion: ${averageTimeToFirstTask}ms`);

    for (const worker of this.workers) await worker.terminate();
  }

  enrollWorker(worker: Worker) {
    this.workerInfoByThreadId.set(worker.threadId, {
      created: new Date(),
    });
  }

  workerTask(worker: Worker) {
    if (this.workerInfoByThreadId.get(worker.threadId)!.firstTask) return;

    this.workerInfoByThreadId.get(worker.threadId)!.firstTask = new Date();
  }

  protected addNewWorker() {
    if (verbose()) warn(`Adding new worker thread`);
    const worker = new Worker(this.taskFile);
    this.enrollWorker(worker);
    worker.on('message', (result) => {
      // In case of success: Call the callback that was passed to `runTask`,
      // remove the `TaskInfo` associated with the Worker, and mark it as free
      // again.
      if (verbose()) warn(`Worker thread ${worker.threadId} finished task`);
      this.workerTask(worker);
      worker[kTaskInfo].done(null, result);
      worker[kTaskInfo] = null;
      worker.unref();
      this.freeWorkers.push(worker);
      this.emit(kWorkerFreedEvent);
    });
    worker.on('error', (err) => {
      warn(`Uncaught exception in worker thread: ${err}`);
      warn(
        `This worker thread will be terminated and a new one launched in its place - which is expensive!`
      );
      // In case of an uncaught exception: Call the callback that was passed to
      // `runTask` with the error.
      if (worker[kTaskInfo]) worker[kTaskInfo].done(err, null);
      else this.emit('error', err);
      // Remove the worker from the list and start a new Worker to replace the
      // current one.
      this.workers.splice(this.workers.indexOf(worker), 1);
      worker.unref();
      this.addNewWorker();
    });
    worker.unref();
    this.workers.push(worker);
    this.freeWorkers.push(worker);
    this.emit(kWorkerFreedEvent);
  }

  /**
   * Errors passed over IPC lose all properties.
   * This function restores the properties of the original error.
   */
  static recoverError(e: unknown): Error {
    if (typeof e !== 'object') return new Error(String(e));
    if (e === null) return new Error('null');
    if (isNativeError(e)) return e;

    // If the error is not a native error, we need to create a new one
    // and copy the properties over.
    // This is a workaround for the fact that the error object is not
    // serialized correctly over IPC.
    const error = new Error('message' in e ? String(e.message) : undefined);
    for (const key of Object.keys(e)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      error[key] = e[key];
    }

    return error;
  }
}
