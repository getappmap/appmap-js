/* eslint-disable func-names */
const { constants: fsConstants, promises: fsp } = require('fs');
const { queue } = require('async');
const glob = require('glob');
const { buildAppMap } = require('@appland/models');
const { promisify } = require('util');

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

async function writeFileAtomic(dirName, fileName, jobId, data) {
  const tempFilePath = join(dirName, `${fileName}.${jobId}`);
  await fsp.writeFile(tempFilePath, data);
  await fsp.rename(tempFilePath, join(dirName, fileName));
}

/**
 * Call a function with each matching file. No guarantee is given that
 * files will be processed in any particular order.
 *
 * @param {string} pattern
 * @param {(filePath: string): void} fn
 * @param {(fileCount: number): void} fileCountFn
 */
async function processFiles(pattern, fn, fileCountFn = () => {}) {
  const q = queue(fn, 5);
  q.pause();
  await new Promise((resolve, reject) => {
    // eslint-disable-next-line consistent-return
    glob(pattern, (err, files) => {
      if (err) {
        console.warn(`An error occurred with glob pattern ${pattern}: ${err}`);
        return reject(err);
      }
      if (fileCountFn) {
        fileCountFn(files.length);
      }
      files.forEach((file) => q.push(file));
      resolve();
    });
  });
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
