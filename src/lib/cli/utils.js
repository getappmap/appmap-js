/* eslint-disable func-names */
const fsp = require('fs').promises;
const { join: joinPath } = require('path');
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

module.exports = {
  baseName,
  listAppMapFiles,
  loadAppMap,
  verbose,
};
