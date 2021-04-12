/* eslint-disable no-underscore-dangle */
const fsp = require('fs').promises;
const { dirname, join: joinPath, isAbsolute, basename } = require('path');
const { verbose, mtime, processFiles } = require('./utils');

// Gets the file path of a location. Location may include a line number or other info
// in addition to the file path.
const parseFilePath = (location) => location.split(':')[0];

class Depends {
  constructor(appMapDir) {
    this.appMapDir = appMapDir;
    this._baseDir = '.';
  }

  baseDir(baseDir) {
    this._baseDir = baseDir;
    return this;
  }

  /**
   * Specify an explicit list of files to check as dependencies.
   * If this option is not used, then all code object locations are examined to
   * see if the AppMap modification time is before the code object source file
   * modification time.
   *
   * @param {string[]} files
   * @returns {Depends}
   */
  files(files) {
    if (!Array.isArray(files)) {
      // eslint-disable-next-line no-param-reassign
      files = [files];
    }
    this.testLocations = new Set(files);
    return this;
  }

  async depends() {
    const outOfDateNames = new Set();

    async function checkClassMap(fileName) {
      const indexDir = dirname(fileName);
      if (basename(indexDir) === 'Inventory') {
        return;
      }

      const mtimeFileName = joinPath(indexDir, 'mtime');
      const createdAt = await mtime(mtimeFileName);

      if (verbose()) {
        console.log(`Checking AppMap ${indexDir}`);
      }

      const classMap = JSON.parse(await fsp.readFile(fileName));
      const codeLocations = new Set();

      // Recurse through the classMap and check whether each source location file has been
      // modified more recently than the AppMap.
      const collectFilePaths = (item) => {
        if (item.location) {
          let filePath = parseFilePath(item.location);
          if (!isAbsolute(filePath)) {
            filePath = joinPath(this._baseDir, filePath);
          }
          codeLocations.add(filePath);
        }
        if (item.children) {
          item.children.forEach(collectFilePaths);
        }
      };
      classMap.forEach(collectFilePaths);

      async function checkFileList(filePath) {
        return this.testLocations.has(filePath);
      }

      async function checkTimestamps(filePath) {
        const dependencyModifiedAt = await mtime(filePath);
        return dependencyModifiedAt && createdAt < dependencyModifiedAt;
      }

      const testFunction = this.testLocations
        ? checkFileList.bind(this)
        : checkTimestamps.bind(this);

      await Promise.all(
        [...codeLocations].map(async (filePath) => {
          if (await testFunction(filePath)) {
            if (verbose()) {
              console.log(`${filePath} requires rebuild of AppMap ${indexDir}`);
            }
            outOfDateNames.add(indexDir);
          }
        })
      );
    }

    await processFiles(
      `${this.appMapDir}/**/classMap.json`,
      checkClassMap.bind(this)
    );

    return [...outOfDateNames].sort();
  }
}

module.exports = Depends;
