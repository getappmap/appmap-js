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
  makeAbsolutePath(filePath) {
    if (isAbsolute(filePath)) {
      return filePath;
    }

    return joinPath(this._baseDir, filePath);
  }

  /**
   * Compute the AppMaps which are out of date with regard to dependency files.
   * Each result is the name of the AppMap file with the suffix 'appmap.json' stripped.
   * If a callback is provided, the AppMaps names are yielded as they are detected.
   *
   * @param {function} callback
   * @returns string[]
   */
  async depends(callback) {
    const outOfDateNames = new Set();

    async function checkClassMap(fileName) {
      const indexDir = dirname(fileName);
      if (basename(indexDir) === 'Inventory') {
        return;
      }

      let appmapUpdatedAtStr;
      try {
        appmapUpdatedAtStr = await fsp.readFile(joinPath(indexDir, 'mtime'));
      } catch (err) {
        if (err.code !== 'ENOENT') console.warn(err);
        return;
      }
      const appmapUpdatedAt = parseFloat(appmapUpdatedAtStr);

      if (verbose()) {
        console.log(
          `Checking AppMap ${indexDir} with timestamp ${appmapUpdatedAt}`
        );
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

      async function isClientProvidedFile(filePath) {
        return this.testLocations.has(filePath);
      }

      async function isFileModifiedSince(filePath) {
        const dependencyFilePath = this.makeAbsolutePath(filePath);
        const dependencyModifiedAt = await mtime(dependencyFilePath);

        // TODO: Actually, if the dependency file does not exist, we should return true.
        // However, at this time we can't tell the difference between a dependency file that has
        // been deleted, and one that never existed in the first place. What does 'never existed in the first place'
        // mean? Well, unfortunately the Ruby agent (and perhaps others?) will write file locations
        // like 'JSON' for native functions that don't actually correspond to real files.
        if (!dependencyModifiedAt) {
          if (verbose())
            console.log(`[depends] ${dependencyFilePath} does not exist`);
          return false;
        }

        const uptodate = appmapUpdatedAt < dependencyModifiedAt;
        if (verbose()) {
          console.log(
            `[depends] ${dependencyFilePath} timestamp is ${dependencyModifiedAt}, ${
              uptodate ? 'up to date' : 'NOT up to date'
            } with ${indexDir} (${appmapUpdatedAt})`
          );
        }

        return uptodate;
      }

      if (this.testLocations && verbose()) {
        console.log(
          `Checking whether AppMap contains any client-provided file: [ ${[
            ...this.testLocations,
          ]
            .sort()
            .join(', ')} ]`
        );
      }

      const testFunction = this.testLocations
        ? isClientProvidedFile.bind(this)
        : isFileModifiedSince.bind(this);

      await Promise.all(
        [...codeLocations].map(async (filePath) => {
          if (await testFunction(filePath)) {
            if (verbose()) {
              console.log(`${filePath} requires rebuild of AppMap ${indexDir}`);
            }
            if (!outOfDateNames.has(indexDir)) {
              if (callback) {
                callback(indexDir);
              }
              outOfDateNames.add(indexDir);
            }
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
