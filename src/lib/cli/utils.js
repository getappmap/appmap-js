/* eslint-disable func-names */
const fsp = require('fs').promises;
const fsExtra = require('fs-extra');
const os = require('os');
const { sep: pathSep, join: joinPath } = require('path');
const { buildAppMap } = require('../../../dist/appmap.node');

let isVerbose = false;
function verbose(v = null) {
  if (v !== null) {
    isVerbose = v;
  }
  return isVerbose;
}

function baseName(file) {
  return file.substring(0, file.length - '.appmap.json'.length);
}

async function listAppMapFiles(directory, fn) {
  if (verbose()) {
    console.log(`Scanning ${directory} for AppMaps`);
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

module.exports = {
  baseName,
  listAppMapFiles,
  loadAppMap,
  verbose,
  buildDirectory,
  renameFile,
};
