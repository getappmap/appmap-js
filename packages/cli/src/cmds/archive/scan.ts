import { exec } from 'child_process';
import { CountNumProcessed } from './CountNumProcessed';
import { processFiles, repeatUntil } from '../../utils';
import { stat, utimes } from 'fs/promises';
import { basename, dirname, join } from 'path';
import reportAppMapProcessingError from './reportAppMapProcessingError';

export async function scan(appmapDir: string): Promise<number> {
  let command = `npx @appland/scanner@latest scan --appmap-dir ${appmapDir} --watch`;

  const workerCount = 2;
  let scanCount = 0;
  const scanAppMap = async (appmapFile: string) => {
    const indexDir = join(dirname(appmapFile), basename(appmapFile, '.appmap.json'));
    const findingsFile = join(indexDir, 'appmap-findings.json');

    const findingsExist = async (): Promise<boolean> => {
      try {
        await stat(findingsFile);
        return true;
      } catch {
        return false;
      }
    };

    const touchFile = async (): Promise<void> => await utimes(appmapFile, new Date(), new Date());
    // Give the first couple of maps a long time to scan, to give the process time to get running.
    const timeout = scanCount < workerCount ? 60000 : 1000;
    await repeatUntil(`Scan ${appmapFile}`, touchFile, findingsExist, 1, timeout);
  };

  const cmd = exec(command);
  cmd.on('error', console.warn);

  const counter = new CountNumProcessed();
  await processFiles(
    `${appmapDir}/**/*.appmap.json`,
    scanAppMap,
    counter.setCount(),
    reportAppMapProcessingError(`Scan`),
    workerCount
  );

  cmd.kill();

  return new Promise((resolve) => {
    cmd.on('exit', resolve);
  });
}
