// eslint-disable-next-line @typescript-eslint/unbound-method
const { dirname } = require('path');
const { verbose, processNamedFiles } = require('./utils');
const { default: UpToDate } = require('./lib/UpToDate');

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
    this.testLocations = new Set(files.filter(Boolean));
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

    const isClientProvidedFile = (filePath) => this.testLocations.has(filePath);

    const upToDate = new UpToDate();
    if (this._baseDir) upToDate.baseDir = this._baseDir;
    if (this.testLocations) upToDate.testFunction = isClientProvidedFile;

    const uptodate = async (classMapFile) => {
      const appmapName = dirname(classMapFile);
      const outOfDateCodeLocations = await upToDate.isOutOfDate(appmapName);
      if (outOfDateCodeLocations) {
        if (callback) callback(appmapName);

        outOfDateNames.add(appmapName);
      }
    };

    await processNamedFiles(this.appMapDir, 'classMap.json', async (fileName) => {
      try {
        await uptodate(fileName);
      } catch (e) {
        console.log(e.code);
        console.warn(`Error checking uptodate ${fileName}: ${e}`);
      }
    });

    if (verbose()) {
      console.debug(`Out of date count: ${outOfDateNames.size}`);
    }

    return [...outOfDateNames].sort();
  }
}

module.exports = Depends;
