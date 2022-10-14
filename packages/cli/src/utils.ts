import { constants as fsConstants, PathLike, promises as fsp, Stats } from 'fs';
import { AsyncWorker, queue } from 'async';
import glob from 'glob';
import { promisify } from 'util';
import { join } from 'path';
import assert from 'assert';
import { Event, ReturnValueObject } from '@appland/models';

const StartTime = Date.now();

export function endTime() {
  return (Date.now() - StartTime) / 1000;
}

let isVerbose = false;
export function verbose(v: boolean | null = null) {
  if (v !== null) {
    isVerbose = v;
  }
  return isVerbose;
}

export function baseName(fileName: string) {
  return fileName.substring(0, fileName.length - '.appmap.json'.length);
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

  let fileStat: Stats;
  try {
    fileStat = await fsp.stat(filePath);
  } catch (e) {
    return null;
  }
  if (!fileStat.isFile()) {
    return null;
  }
  return fileStat.mtimeMs;
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
  await fsp.rename(tempFilePath, join(dirName, fileName));
}

/**
 * Call a function with each matching file. No guarantee is given that
 * files will be processed in any particular order.
 */
export async function processFiles(
  pattern: string,
  fn: AsyncWorker<string>,
  fileCountFn = (count: number) => {}
): Promise<void> {
  const q = queue(fn, 5);
  q.pause();
  const files = await promisify(glob)(pattern);
  if (fileCountFn) {
    fileCountFn(files.length);
  }
  if (files.length === 0) return;
  files.forEach((file) => q.push(file));
  q.resume();
  await q.drain();
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
  if (value === null || value === undefined) {
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
