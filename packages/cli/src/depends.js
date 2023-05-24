const fsp = require('fs').promises;
const { dirname, join: joinPath, isAbsolute, basename } = require('path');
const { verbose, mtime, processNamedFiles } = require('./utils');

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
    this.mtimes = new Map();
    this.mtimeCacheHitCount = 0;
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
    this.testLocations = new Set(files.filter(Boolean));
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
  async depends(callback = undefined) {
    const outOfDateNames = new Set();

    const checkClassMap = async (fileName) => {
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
        console.log(`Checking AppMap ${indexDir} with timestamp ${appmapUpdatedAt}`);
      }

      const reportOutOfDate = (filePath) => {
        if (verbose()) {
          console.log(`${filePath} requires rebuild of AppMap ${indexDir}`);
        }
        if (!outOfDateNames.has(indexDir)) {
          if (callback) {
            callback(indexDir);
          }
          outOfDateNames.add(indexDir);
        }
      };

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

      const isClientProvidedFile = (filePath) => this.testLocations.has(filePath);

      const modifiedTime = async (filePath) => {
        const result = this.mtimes.get(filePath);
        if (result || result === false) {
          this.mtimeCacheHitCount += 1;
          return result;
        }

        const dependencyFilePath = this.makeAbsolutePath(filePath);
        let dependencyModifiedAt = await mtime(dependencyFilePath);

        // TODO: Actually, if the dependency file does not exist, we should return true.
        // However, at this time we can't tell the difference between a dependency file that has
        // been deleted, and one that never existed in the first place. What does 'never existed in the first place'
        // mean? Well, unfortunately the Ruby agent (and perhaps others?) will write file locations
        // like 'JSON' for native functions that don't actually correspond to real files.
        if (!dependencyModifiedAt) {
          dependencyModifiedAt = false;
          if (verbose()) console.log(`[depends] ${dependencyFilePath} does not exist`);
        }

        this.mtimes.set(filePath, dependencyModifiedAt);
        return dependencyModifiedAt;
      };

      const isFileModifiedSince = async (filePath) => {
        const dependencyModifiedAt = await modifiedTime(filePath);
        if (dependencyModifiedAt === false) return false;

        const uptodate = appmapUpdatedAt < dependencyModifiedAt;
        if (!uptodate && verbose()) {
          console.log(
            `[depends] ${filePath} timestamp is ${dependencyModifiedAt}, NOT up to date with ${indexDir} (${appmapUpdatedAt})`
          );
        }

        return uptodate;
      };

      const testFunction = this.testLocations ? isClientProvidedFile : isFileModifiedSince;

      await Promise.all(
        [...codeLocations].map(async (filePath) => {
          if (await testFunction(filePath)) {
            if (verbose()) console.debug(`[depends] ${indexDir} is out of date due to ${filePath}`);
            reportOutOfDate(filePath, indexDir);
          }
        })
      );
    };

    await processNamedFiles(this.appMapDir, 'classMap.json', async (fileName) => {
      try {
        await checkClassMap(fileName);
      } catch (e) {
        console.log(e.code);
        console.warn(`Error checking uptodate ${fileName}: ${e}`);
      }
    });

    if (verbose()) {
      console.debug(`File mtime cache hit count: ${this.mtimeCacheHitCount}`);
      console.debug(`Out of date count: ${outOfDateNames.size}`);
    }

    return [...outOfDateNames].sort();
  }
}

module.exports = Depends;
