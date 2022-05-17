/* eslint-disable func-names */
const {
  constants: fsConstants,
  promises: fsp,
  rm,
  readdir,
  utimes,
} = require('fs');
const fsExtra = require('fs-extra');
const { queue } = require('async');
const glob = require('glob');
const os = require('os');
const { sep: pathSep, join: joinPath, basename, join } = require('path');
const { buildAppMap } = require('@appland/models');
const { rename } = require('fs/promises');

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

const renameFile = async (oldName, newName) =>
  fsExtra.move(oldName, newName, { clobber: true });

/**
 * @param {string} path
 */
async function touch(path) {
  return new Promise((resolve) => {
    const time = Date.now();
    utimes(path, time, time, (utimesErr) => {
      if (utimesErr) {
        console.warn(utimesErr);
      }
      return resolve();
    });
  });
}

/**
 * Builds a directory using a tempdir, which is renamed at the end to
 * a specified directory name.
 *
 * @param {string} dirName
 * @param {function} contentFunction
 */
const buildDirectory = async (dirName, contentFunction) => {
  const tempPath = await fsp.realpath(os.tmpdir());
  const tempDir = await fsp.mkdtemp(tempPath + pathSep);
  const discardDir = await fsp.mkdtemp(tempPath + pathSep);

  try {
    await contentFunction(tempDir);
  } catch (err) {
    rm(tempDir, { recursive: true }, (e) => {
      console.warn(`Unable to remove (cleanup) tempdir: ${e.message}`);
    });
    throw err;
  }

  // Move dirName to a temp dir
  // Move tempDir to the final dirName
  try {
    await rename(dirName, join(discardDir, basename(dirName)));
    setTimeout(
      () =>
        rm(discardDir, { recursive: true }, (err) => {
          if (err) console.warn(err);
        }),
      0
    );
  } catch (e) {
    if (e.code !== 'ENOENT') {
      console.log(`Unable to rename ${dirName} to ${discardDir}: ${e.message}`);
      throw e;
    }
  }
  try {
    await rename(tempDir, dirName);
  } catch (e) {
    console.log(`Unable to rename ${tempDir} to ${dirName}: ${e.message}`);
    return;
  }

  // Touch all the created files. This is to ensure that file watchers are notified, because
  // when the directory is renamed into place, filesystem watchers may not report on all the
  // files inside the directory.
  readdir(dirName, (readErr, files) => {
    if (readErr) {
      console.warn(`Unable to read directory ${dirName}: ${readErr.message}`);
      return;
    }
    files
      .filter((file) => !['.', '..'].includes(file))
      .map((file) => touch(join(dirName, file)));
  });
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
  mtime,
  verbose,
  processFiles,
  buildDirectory,
  renameFile,
  exists,
  prefixLines,
};
