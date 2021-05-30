/* eslint-disable func-names */
const fsp = require('fs').promises;
const fsExtra = require('fs-extra');
const { queue } = require('async');
const glob = require('glob');
const os = require('os');
const { sep: pathSep, join: joinPath } = require('path');
const { buildAppMap } = require('@appland/models');

let isVerbose = false;
function verbose(v = null) {
  if (v !== null) {
    isVerbose = v;
  }
  return isVerbose;
}

function baseName(fileName) {
  return fileName.substring(0, fileName.length - '.appmap.json'.length);
}

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
  return fileStat.ctime.getTime();
}

/**
 * Call a function with each matching file.
 *
 * @param {string} pattern
 * @param {Function} fn
 */
async function processFiles(pattern, fn) {
  const q = queue(fn, 5);
  q.pause();
  await new Promise((resolve, reject) => {
    // eslint-disable-next-line consistent-return
    glob(pattern, (err, files) => {
      if (err) {
        console.warn(`An error occurred with glob pattern ${pattern}: ${err}`);
        return reject(err);
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

async function loadAppMap(filePath) {
  return buildAppMap()
    .source(JSON.parse(await fsp.readFile(filePath)))
    .normalize()
    .build();
}

const renameFile = async (oldName, newName) => {
  await fsExtra.move(oldName, newName, { clobber: true });
};

/**
 * Builds a directory using a tempdir, which is renamed at the end to
 * a specified directory name.
 *
 * @param {string} dirName
 * @param {function} fn
 */
const buildDirectory = async (dirName, fn) => {
  const tempDir = await fsp.mkdtemp(
    (await fsp.realpath(os.tmpdir())) + pathSep
  );
  try {
    await fn(tempDir);
    await renameFile(tempDir, dirName);
  } catch (err) {
    fsExtra.remove(tempDir).catch((e) => {
      console.warn(`Unable to remove (cleanup) tempdir: ${e.message}`);
    });
    throw err;
  }
};

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

module.exports = {
  baseName,
  formatValue,
  formatHttpServerRequest,
  listAppMapFiles,
  loadAppMap,
  mtime,
  verbose,
  processFiles,
  buildDirectory,
  renameFile,
};
