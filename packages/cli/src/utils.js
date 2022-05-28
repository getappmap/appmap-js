/* eslint-disable func-names */
const { constants: fsConstants, promises: fsp } = require('fs');
const { queue } = require('async');
const glob = require('glob');
const { join: joinPath } = require('path');
const { buildAppMap } = require('@appland/models');

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

async function ctime(filePath) {
  let fileStat;
  try {
    fileStat = await fsp.stat(filePath);
  } catch (e) {
    return null;
  }
  if (!fileStat.isFile()) {
    return null;
  }
  return fileStat.ctime.getTime();
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
  const files = await fsp.readdir(directory);
  await Promise.all(
    files
      .filter((file) => file !== '.' && file !== '..')
      // eslint-disable-next-line prefer-arrow-callback
      .map(async function (file) {
        const path = joinPath(directory, file);
        const stat = await fsp.stat(path);
        if (stat.isDirectory()) {
          await listAppMapFiles(path, fn);
        }

        if (file.endsWith('.appmap.json')) {
          await fn(path);
        }

        return null;
      })
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
  listAppMapFiles,
  loadAppMap,
  ctime,
  verbose,
  processFiles,
  exists,
  prefixLines,
};
