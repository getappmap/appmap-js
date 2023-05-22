import { constants as fsConstants, PathLike, promises as fsp, Stats } from 'fs';
import gracefulFs from 'graceful-fs';
import { AsyncWorker, queue } from 'async';
import glob from 'glob';
import { promisify } from 'util';
import { join } from 'path';
import assert from 'assert';
import { Event, ReturnValueObject } from '@appland/models';
import { readdir, stat } from 'fs/promises';

const StartTime = Date.now();
const renameFile = promisify(gracefulFs.rename);

export function endTime() {
  return (Date.now() - StartTime) / 1000;
}

let isVerbose = false;
export function verbose(v?: boolean) {
  if (v !== undefined) {
    isVerbose = v;
  }
  return isVerbose;
}

export function baseName(fileName: string) {
  return fileName.substring(0, fileName.length - '.appmap.json'.length);
}

async function statFile(filePath: PathLike): Promise<Stats | null> {
  try {
    return await fsp.stat(filePath);
  } catch (e) {
    return null;
  }
}

/**
 * Gets the last modified time of a file.
 *
 * @returns file mtime in ms, or null if the file does not exist or
 * is not a file.
 */
export async function mtime(filePath: PathLike): Promise<number | null> {
  // NB: 'ctime' is actually the time that the stats of the file were last changed.
  // And 'birthtime' is not guaranteed across platforms.
  // Therefore mtime is the most reliable indicator of when the file was created,
  // especially since we write files atomically (e.g. by moving them into place after writing them
  // as temp files).

  const fileStat = await statFile(filePath);
  if (!fileStat || !fileStat.isFile()) {
    return null;
  }
  return fileStat.mtimeMs;
}

export async function isFile(filePath: PathLike): Promise<boolean> {
  const fileStat = await statFile(filePath);
  return !!(fileStat && fileStat.isFile());
}

/**
 * Atomically write a file by first writing to a temporary file in the same
 * directory then renaming in place.
 * @param dirName target directory path
 * @param fileName target file name
 * @param suffix used to create the temporary file name
 * @param data
 */
export async function writeFileAtomic(
  dirName: string,
  fileName: string,
  suffix: string,
  data: string
) {
  // first make sure the temp name isn't too long
  const NAME_MAX = 255; // note: might not be true on some esoteric systems
  const name = fileName.slice(0, NAME_MAX - suffix.length - 1);

  const tempFilePath = join(dirName, `${name}.${suffix}`);
  await fsp.writeFile(tempFilePath, data);
  await renameFile(tempFilePath, join(dirName, fileName));
}

/**
 * Call a function with each matching file. No guarantee is given that
 * files will be processed in any particular order.
 */
export async function processFiles(
  pattern: string,
  fn: AsyncWorker<string>,
  fileCountFn = (_count: number) => {},
  errorFn = (err: Error) => {
    process.stderr.write(err.toString() + '\n');
  },
  workerCount = 2
): Promise<void> {
  const files = await promisify(glob)(pattern);
  if (fileCountFn) {
    fileCountFn(files.length);
  }
  if (files.length === 0) return;

  const q = queue(fn, workerCount);
  q.error(errorFn);
  files.forEach((file) => q.push(file));
  if (!q.idle()) await q.drain();
}

/**
 * Finds all occurrances of `fileName` within a base directory. Each match must be a file, not a directory.
 * This is optimized compared to `processFiles` because it does not use `glob`, which is pretty slow for this use case.
 * It also begins processing right away, rather than waiting for all files to be enumerated.
 */
export async function processNamedFiles(
  baseDir: string,
  fileName: string,
  fn: AsyncWorker<string>
): Promise<number> {
  const q = queue(fn, 2);

  const stats = async (fileName: string): Promise<Stats | undefined> => {
    try {
      return await stat(fileName);
    } catch {
      // Ignore
    }
  };

  let matchCount = 0;
  const processDir = async (dir: string) => {
    // If the directory contains the target fileName, add it to the process queue and return.
    const targetFileName = join(dir, fileName);
    const target = await stats(targetFileName);
    if (target && target.isFile()) {
      matchCount += 1;
      q.push(targetFileName);
      return;
    }

    // Otherwise, recurse on all subdirectories.
    for (const childName of await readdir(dir)) {
      const child = await stats(join(dir, childName));
      if (child && child.isDirectory()) {
        await processDir(join(dir, childName));
      }
    }
  };
  await processDir(baseDir);

  if (matchCount) await q.drain();

  return matchCount;
}

/**
 * Lists all appmap.json files in a directory, and passes them to a function.
 * With `await`, `listAppMapFiles` blocks until all the files have been processed.
 */
export async function listAppMapFiles(
  directory: string,
  fn: (path: string) => Promise<void> | void
) {
  const printDebug = verbose();
  if (printDebug) {
    console.warn(`Scanning ${directory} for AppMaps`);
  }

  const opts = {
    strict: false,
    silent: !printDebug,
  };
  await Promise.all((await promisify(glob)(`${directory}/**/*.appmap.json`, opts)).map(fn));
}

export function exists(path: PathLike): Promise<boolean> {
  return new Promise((resolve) => {
    fsp
      .access(path, fsConstants.R_OK)
      .then(() => {
        resolve(true);
      })
      .catch(() => {
        resolve(false);
      });
  });
}

/**
 * Append a prefix to each line in a string
 * @param str the string to be prefixed
 * @param prefix a string to prefix each line with
 * @returns the resulting string which starts each line with a prefix
 */
export function prefixLines(str: string, prefix: string): string {
  return str.replace(/^/gm, prefix);
}

export function formatValue(value: ReturnValueObject) {
  if (value === null || value === undefined || value.value === null || value.value === undefined) {
    return 'Null';
  }

  const valueStr = value.value.indexOf('#<') === 0 ? null : value.value;

  return [value.class, valueStr].filter((e) => e).join(' ');
}

export function formatHttpServerRequest(event: Event): string {
  assert(event.httpServerRequest);
  const data = {
    method: event.httpServerRequest.request_method,
    path: event.httpServerRequest.normalized_path_info || event.httpServerRequest.path_info,
    statusCode:
      event.returnEvent && event.httpServerResponse
        ? (event.httpServerResponse as any)['status_code'] || event.httpServerResponse.status
        : '<none>',
  };
  return [data.method, data.path, `(${data.statusCode})`].join(' ');
}

export async function repeatUntil(
  jobName: string,
  trigger: () => Promise<void>,
  condition: () => Promise<boolean>,
  interval: number,
  timeRemaining: number,
  currentRetry = 0
): Promise<void> {
  return new Promise((resolve, reject) => {
    const retry = () => {
      if (timeRemaining < 0) {
        reject(new Error(`${jobName}: Exceeded maximum number of retries`));
        return;
      }

      const backoffTime = Math.pow(2, currentRetry) * interval;
      console.debug(`${jobName}: Retrying in ${backoffTime}ms`);
      setTimeout(() => {
        repeatUntil(
          jobName,
          trigger,
          condition,
          interval,
          timeRemaining - backoffTime,
          currentRetry + 1
        )
          .then(resolve)
          .catch(reject);
      }, backoffTime);
    };

    const check = () =>
      condition()
        .then((result) => (result ? resolve() : retry()))
        .catch(retry);

    trigger().then(check).catch(retry);
  });
}
