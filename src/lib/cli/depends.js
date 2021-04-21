const fsp = require('fs').promises;
const { dirname, join: joinPath, isAbsolute, basename } = require('path');
const { verbose, mtime, processFiles } = require('./utils');

// Gets the file path of a location. Location may include a line number or other info
// in addition to the file path.
const parseFilePath = (location) => location.split(':')[0];

class Depends {
  /**
   * @param {string} appMapDir
   */
  constructor(appMapDir) {
    this.appMapDir = appMapDir;
    this.baseDir = '.';
  }

  /**
   * Sets a base directory which will be used to resolve dependency file names.
   * This is useful when the dependency files of an AppMap are located in a different
   * directory than the AppMap file. baseDir is only applied to file paths which are
   * detected in the classMap; it's not applied to file paths which are provided explicitly
   * via the `files` method.
   *
   * @param {string} baseDir
   */
  set baseDir(baseDir) {
    this._baseDir = baseDir;
  }

  /**
   * Specify an explicit list of files to check as dependencies.
   * If this option is not used, then all code object locations are examined to
   * see if the AppMap modification time is before the code object source file
   * modification time.
   *
   * @param {string[]} files
   */
  set files(files) {
    if (!Array.isArray(files)) {
      // eslint-disable-next-line no-param-reassign
      files = [files];
    }
    this.testLocations = new Set(files);
  }

  /**
   * Prepend the baseDir to filePath, unless filePath is absolute.
   *
   * @param {string} filePath
   * @returns string
   */
  applyBaseDir(filePath) {
    if (isAbsolute(filePath)) {
      return filePath;
    }

    return joinPath(this._baseDir, filePath);
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
        console.warn(`Checking AppMap ${indexDir}`);
      }

      const classMap = JSON.parse(await fsp.readFile(fileName));
      const codeLocations = new Set();

      const collectFilePaths = (item) => {
        if (item.location) {
          const filePath = parseFilePath(item.location);
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
        const dependencyFilePath = this.applyBaseDir(filePath);
        if (verbose()) {
          console.warn(`Checking timestamp of : ${dependencyFilePath}`);
        }
        const dependencyModifiedAt = await mtime(dependencyFilePath);
        return dependencyModifiedAt && createdAt < dependencyModifiedAt;
      }

      if (this.testLocations && verbose()) {
        console.warn(
          `Checking whether AppMap contains any client-provided file: [ ${[
            ...this.testLocations,
          ]
            .sort()
            .join(', ')} ]`
        );
      }

      const testFunction = this.testLocations
        ? checkFileList.bind(this)
        : checkTimestamps.bind(this);

      await Promise.all(
        [...codeLocations].map(async (filePath) => {
          if (await testFunction(filePath)) {
            if (verbose()) {
              console.warn(
                `${filePath} requires rebuild of AppMap ${indexDir}`
              );
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
