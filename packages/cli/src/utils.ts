import { constants as fsConstants, PathLike, promises as fsp, Stats } from 'fs';
import gracefulFs from 'graceful-fs';
import { AsyncWorker, queue } from 'async';
import { promisify } from 'util';
import { join } from 'path';
import assert from 'assert';
import { Event, ReturnValueObject } from '@appland/models';
import { readdir } from 'fs/promises';

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

export type CodedError = { code: string };

export function isCodedError(error: any): error is CodedError {
  if (!error.code) return false;

  return typeof error.code === 'string';
}

/**
 * Gets the last modified time of a file.
 *
 * @returns file mtime in ms, or null if the file does not exist or
 * is not a file.
 */
export async function mtime(filePath: PathLike): Promise<number | undefined> {
  // NB: 'ctime' is actually the time that the stats of the file were last changed.
  // And 'birthtime' is not guaranteed across platforms.
  // Therefore mtime is the most reliable indicator of when the file was created,
  // especially since we write files atomically (e.g. by moving them into place after writing them
  // as temp files).

  const fileStat = await statFile(filePath);
  if (!fileStat?.isFile()) {
    return;
  }
  return fileStat.mtimeMs;
}

export async function isFile(filePath: PathLike): Promise<boolean> {
  const fileStat = await statFile(filePath);
  return !!fileStat?.isFile();
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

export class ProcessFileOptions {
  public fileCountFn = (_count: number) => {};
  public errorFn = (err: Error) => {
    process.stderr.write(err.toString() + '\n');
  };
  public workerCount = 2;
}

export type FilePredicate = (file: string) => boolean | Promise<boolean>;

/**
 * Call a function with each matching file. No guarantee is given that
 * files will be processed in any particular order.
 */
export async function processFiles(
  dir: string,
  extensionOrPredicate: string | FilePredicate,
  fn: AsyncWorker<string>,
  options = new ProcessFileOptions()
): Promise<number> {
  const files = await findFiles(dir, extensionOrPredicate);
  options.fileCountFn(files.length);
  if (files.length === 0) return 0;

  const q = queue(fn, options.workerCount);
  q.error(options.errorFn);
  files.forEach((file) => q.push(file));
  if (!q.idle()) await q.drain();
  return files.length;
}

/**
 * Finds all occurrances of `fileName` within a base directory. Each match must be a file, not a directory.
 * If a searched file is found, the sibling subdirectories are not recursed into.
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
      return await fsp.lstat(fileName);
    } catch {
      // Ignore
    }
  };

  let matchCount = 0;
  const processDir = async (dir: string) => {
    // If the directory contains the target fileName, add it to the process queue and return.
    const targetFileName = join(dir, fileName);
    const target = await stats(targetFileName);
    if (target?.isFile()) {
      matchCount += 1;
      q.push(targetFileName);
      return;
    }

    // Otherwise, recurse on all subdirectories.
    let children: string[];
    try {
      children = await readdir(dir);
    } catch (err) {
      children = [];
    }
    for (const childName of children) {
      const child = await stats(join(dir, childName));
      if (child?.isDirectory()) {
        await processDir(join(dir, childName));
      }
    }
  };
  await processDir(baseDir);

  q.error(console.warn);
  if (!q.idle()) await q.drain();

  return matchCount;
}

export function isNodeError(error: unknown, code?: string): error is NodeJS.ErrnoException {
  return error instanceof Error && (!code || (error as NodeJS.ErrnoException).code === code);
}

/**
 * Lists all matching files in a directory, and passes them to an optional function.
 */
export async function findFiles(
  directory: string,
  extensionOrPredicate: string | FilePredicate,
  fn?: ((path: string) => Promise<any> | any) | undefined
): Promise<string[]> {
  const printDebug = verbose();
  if (printDebug) {
    console.warn(`Scanning ${directory} for files matching ${extensionOrPredicate}`);
  }

  const matchFile = async (file: string): Promise<boolean> => {
    if (typeof extensionOrPredicate === 'string') {
      return file.endsWith(extensionOrPredicate);
    } else {
      return await extensionOrPredicate(file);
    }
  };

  const traverseDirectory = async (
    dir: string,
    result = new Array<string>()
  ): Promise<string[]> => {
    let files: string[];
    try {
      files = await readdir(dir);
    } catch (err) {
      const code = (err as any).code;
      if (code === 'ENOENT') return result;

      throw err;
    }

    for (const file of files) {
      const path = join(dir, file);
      let stat: Stats;
      try {
        stat = await fsp.stat(path);
      } catch (err) {
        const code = (err as any).code;
        if (code === 'ENOENT') return result;

        throw err;
      }
      if (stat.isDirectory()) {
        await traverseDirectory(path, result);
      } else if (stat.isFile() && (await matchFile(path))) {
        if (fn) await fn(path);
        result.push(path);
      }
    }
    return result;
  };
  return await traverseDirectory(directory);
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

export function formatValue(value?: ReturnValueObject) {
  if (value?.value === null || value?.value === undefined) {
    return 'Null';
  }

  const valueStr = value.value.startsWith('#<') ? null : value.value;

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

/**
 * Convert a kebab-case string to camelCase.
 */
export function kebabToCamelCase(kebabStr: string): string {
  const tokens = kebabStr.split('-');
  const [firstToken, ...remainingTokens] = tokens;
  const capitalizedTokens = remainingTokens.map((token) =>
    token.length === 0 ? token : token.charAt(0).toUpperCase() + token.slice(1)
  );
  return [firstToken, ...capitalizedTokens].join('');
}
