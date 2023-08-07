import { listAppMapFiles, verbose } from '../../utils';
import WorkerPool from '../../lib/workerPool';
import { basename, dirname, join } from 'path';
import { ScanTask } from './ScanTask';
import { ScanResults } from '@appland/scanner/src/report/scanResults';
import { log, warn } from 'console';
import { writeFile } from 'fs/promises';

export async function scan(
  appmapDir: string,
  threadCount: number,
  configFile: string,
  maxSize: number
): Promise<number> {
  const files = new Array<string>();
  await listAppMapFiles(appmapDir, (file) => files.push(file));

  const workerPool = new WorkerPool(join(__dirname, 'scanWorker.js'), threadCount);

  const task = (file: string): ScanTask => ({
    verbose: verbose(),
    appmapFile: file,
    maxSize,
    configurationFile: configFile,
  });

  let findingCount = 0;
  await Promise.all(
    files.map(
      async (file) =>
        new Promise<void>((resolve, reject) =>
          workerPool.runTask(task(file), async (err: Error | null, result: ScanResults) => {
            if (err) return reject(err);

            if (result.oversized) {
              warn(`Skipping oversized AppMap ${file}`);
              return resolve();
            }
            if (result.error) {
              warn(`Failed to scan ${file}: ${(result.error as Error).message}`);
              return resolve();
            }

            findingCount += result.findings.length;

            const reportFile = join(
              dirname(file),
              basename(file, '.appmap.json'),
              'appmap-findings.json'
            );
            try {
              await writeFile(reportFile, JSON.stringify(result, null, 2));
            } catch (err) {
              warn(`Failed to write findings to ${reportFile}: ${(err as Error).message}`);
            }

            resolve();
          })
        )
    )
  ).finally(() => workerPool.close());

  log(`Found ${findingCount} findings in ${files.length} AppMaps`);
}
