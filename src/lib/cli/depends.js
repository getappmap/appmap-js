const { queue } = require('async');
const glob = require('glob');
const fsp = require('fs').promises;
const { dirname, basename } = require('path');
const { verbose } = require('./utils');

/**
 * Gets a list of AppMap base paths that depend on at least one file from an input list.
 *
 * @param {Array<string>} files
 */
async function depends(directory, files) {
  if (verbose()) {
    console.log(
      `Scanning ${directory} for AppMaps which depend on something in ${files.join(
        ', '
      )}`
    );
  }
  const inputFiles = new Set();
  files.forEach(inputFiles.add.bind(inputFiles));
  const baseNames = new Set();

  async function collectDepends(classMapFile) {
    const dirName = dirname(classMapFile);
    if (verbose()) {
      console.log(`Checking ${dirName}`);
    }
    if (basename(dirName) === 'Inventory') {
      return;
    }
    const classMap = JSON.parse(await fsp.readFile(classMapFile));

    // Gets the file path of a location. Location may include a line number or other info
    // in addition to the file path.
    const parseFilePath = (location) => location.split(':')[0];

    // eslint-disable-next-line max-len
    // Recurse through the classMap and emit the metadata.source_location if a path match is found.
    const mapNode = (item) => {
      // Short circuit the rest of the search when a match is found.
      if (baseNames.has(dirName)) {
        return;
      }

      if (item.location) {
        const filePath = parseFilePath(item.location);

        if (inputFiles.has(filePath)) {
          if (verbose()) {
            console.log(
              `${item.location} matches an input file. Emitting AppMap ${dirName}`
            );
          }
          baseNames.add(dirName);
          return;
        }
      }
      if (item.children) {
        item.children.forEach(mapNode);
      }
    };
    classMap.forEach(mapNode);
  }

  const q = queue(collectDepends, 5);
  q.pause();
  await new Promise((resolve, reject) => {
    // eslint-disable-next-line consistent-return
    glob(`${directory}/**/classMap.json`, (err, classMapFiles) => {
      if (err) {
        console.warn(err);
        return reject(err);
      }
      classMapFiles.forEach((file) => q.push(file));
      resolve();
    });
  });
  q.resume();
  await q.drain();

  return [...baseNames].sort();
}

module.exports = depends;
