/* eslint-disable func-names */
const { constants: fsConstants, promises: fsp } = require('fs');
const { queue } = require('async');
const glob = require('glob');
const { buildAppMap } = require('@appland/models');
const { promisify } = require('util');
const { join } = require('path');
const assert = require('assert');

const StartTime = Date.now();

function endTime() {
  return (Date.now() - StartTime) / 1000;
}

let isVerbose = false;
function verbose(/** @type {boolean|null} */ v = null) {
  if (v !== null) {
    isVerbose = v;
  }
  return isVerbose;
}

function baseName(/** @type string */ fileName) {
  return fileName.substring(0, fileName.length - '.appmap.json'.length);
}

/**
 * Gets the last modified time of a file.
 *
 * @returns {Promise<number|null>} file mtime, or null if the file does not exist or
 * is not a file.
 */
// NB: 'ctime' is actually the time that the stats of the file were last changed.
// And 'birthtime' is not guaranteed across platforms.
// Therefore mtime is the most reliable indicator of when the file was created,
// especially since we write files atomically (e.g. by moving them into place after writing them
// as temp files).
async function mtime(filePath) {
  let fileStat;
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
 * @param {string} dirName target directory path
 * @param {string} fileName target file name
 * @param {unknown} jobId used to create the temporary file name
 * @param {string} data
 */
async function writeFileAtomic(dirName, fileName, jobId, data) {
  const suffix = jobId.toString();

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
 *
 * @param {string | undefined} pattern
 * @param {string[] | undefined} files
 * @param {(filePath: string): void} fn
 * @param {(fileCount: number): void} fileCountFn
 */
async function processFiles(
  pattern,
  files,
  fn,
  // eslint-disable-next-line no-unused-vars
  fileCountFn = (/** @type {number} */ count) => {}
) {
  const q = queue(fn, 5);
  q.pause();
  let fileList;
  if (files) {
    fileList = files;
  } else {
    assert(pattern, `pattern or files argument is required`);
    fileList = await promisify(glob)(pattern);
  }
  if (fileCountFn) {
    fileCountFn(fileList.length);
  }
  if (fileList.length === 0) return;
  fileList.forEach((file) => q.push(file));
  q.resume();
  await q.drain();
}

/**
 * Lists all appmap.json files in a directory, and passes them to a function.
 * With `await`, `listAppMapFiles` blocks until all the files have been processed.
 *
 * @param {string} directory
 * @param {Function(string)} fn
 */
async function listAppMapFiles(directory, fn) {
  if (verbose()) {
    console.warn(`Scanning ${directory} for AppMaps`);
  }
  await Promise.all(
    (await promisify(glob)(`${directory}/**/*.appmap.json`)).map(fn)
  );
}

/**
 * @param {PathLike} path
 * @returns {Promise<boolean>}
 */
function exists(path) {
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

async function loadAppMap(filePath) {
  return buildAppMap()
    .source(JSON.parse(await fsp.readFile(filePath)))
    .normalize()
    .build();
}

function formatValue(value) {
  if (!value) {
    return 'Null';
  }

  const valueStr = value.value.indexOf('#<') === 0 ? null : value.value;

  return [value.class, valueStr].filter((e) => e).join(' ');
}

function formatHttpServerRequest(event) {
  const data = {
    method: event.httpServerRequest.request_method,
    path:
      event.httpServerRequest.normalized_path_info ||
      event.httpServerRequest.path_info,
    statusCode:
      event.returnEvent && event.httpServerResponse
        ? event.httpServerResponse.status_code ||
          event.httpServerResponse.status
        : '<none>',
  };
  return [data.method, data.path, `(${data.statusCode})`].join(' ');
}

/**
 * Append a prefix to each line in a string
 * @param {string} str the string to be prefixed
 * @param {string} prefix a string to prefix each line with
 * @returns {string} the resulting string which starts each line with a prefix
 */
function prefixLines(str, prefix) {
  return str.replace(/^/gm, prefix);
}

module.exports = {
  baseName,
  endTime,
  formatValue,
  formatHttpServerRequest,
  writeFileAtomic,
  listAppMapFiles,
  loadAppMap,
  mtime,
  verbose,
  processFiles,
  exists,
  prefixLines,
};
