import { join } from 'path';
import processAppMapDir, {
  Task,
  TaskFunction,
  TaskResult,
} from '../../../src/lib/processAppMapDir';
import WorkerPool from '../../../src/lib/workerPool';

describe('processAppMapDir', () => {
  let workerPool: WorkerPool;
  let jobFile: string;

  const buildWorkerPool = () => (workerPool = new WorkerPool(jobFile, 1));
  const makeAppMapTask = (appmapFile: string) => ({ appmapFile, verbose: false });

  afterEach(async () => (workerPool ? await workerPool.close() : undefined));

  describe('event counting task', () => {
    beforeEach(() => ((jobFile = join(__dirname, 'count-appmap-events.mjs')), buildWorkerPool()));
    const appmapFiles = ['revoke_api_key.appmap.json', 'user_page_scenario.appmap.json'].map((f) =>
      join(__dirname, '..', 'fixtures', 'ruby', f)
    );

    it('sums the AppMap events', async () => {
      const result = await processAppMapDir(
        'Sum AppMap events',
        workerPool,
        makeAppMapTask,
        undefined,
        appmapFiles
      );
      expect(result.oversized.size).toEqual(0);
      expect(result.errors).toHaveLength(0);
      expect(result.numProcessed).toEqual(2);
    });

    it('handles a malformed task', async () => {
      const makeMalformedTask = (appmapFile: string) =>
        ({ wrongarg: appmapFile, verbose: false } as unknown as Task);
      const result = await processAppMapDir(
        'Handle a malformed task',
        workerPool,
        makeMalformedTask,
        undefined,
        appmapFiles
      );
      expect(result.oversized.size).toEqual(0);
      expect(result.errors).toHaveLength(2);
      expect(result.numProcessed).toEqual(2);
      const errorMessage = result.errors[0].toString();
      expect(errorMessage).toContain(`TypeError: The "path" argument must be of type string`);
    });

    it('propagates the result to a custom handler', async () => {
      const processedFiles = new Set<string>();
      let totalEvents = 0;
      const handler = (appmapFile: string, result: any) => {
        processedFiles.add(appmapFile);
        totalEvents += result.events;
      };
      await processAppMapDir(
        'Count AppMap events',
        workerPool,
        makeAppMapTask,
        undefined,
        appmapFiles,
        handler
      );
      expect(processedFiles.size).toEqual(2);
      expect(totalEvents).toEqual(48 + 84);
    });
  });

  describe('malformed AppMap', () => {
    const appmapFiles = ['fixtures/malformedParentId/parent_id_49_does_not_exist.appmap.json'].map(
      (f) => join(__dirname, '..', f)
    );

    describe('unhandled error', () => {
      beforeEach(() => ((jobFile = join(__dirname, 'unhandled-error.mjs')), buildWorkerPool()));

      it('reports the error', async () => {
        const result = await processAppMapDir(
          'Load AppMap',
          workerPool,
          makeAppMapTask,
          undefined,
          appmapFiles
        );
        expect(result.oversized.size).toEqual(0);
        expect(result.errors).toHaveLength(1);
        expect(result.unhandledErrors).toHaveLength(1);
        expect(result.numProcessed).toEqual(1);
        const errorMessage = result.errors[0].toString();
        expect(errorMessage).toContain(`Error: Here comes an unhandled error`);
      });
    });

    describe('caught exception', () => {
      beforeEach(() => ((jobFile = join(__dirname, 'handled-error.mjs')), buildWorkerPool()));

      it('reports the error', async () => {
        const result = await processAppMapDir(
          'Load AppMap',
          workerPool,
          makeAppMapTask,
          undefined,
          appmapFiles
        );
        expect(result.oversized.size).toEqual(0);
        expect(result.errors).toHaveLength(1);
        expect(result.unhandledErrors).toHaveLength(0);
        expect(result.numProcessed).toEqual(1);
        const errorMessage = result.errors[0].toString();
        expect(errorMessage).toContain(`Error: Handle this error`);
      });
    });
  });
});
