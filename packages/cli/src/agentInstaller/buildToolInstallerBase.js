// @ts-check

const { existsSync } = require('fs');
const { join } = require('path');

class BuildToolInstallerBase {
  /**
   * @param {string} buildFile
   * @param {string} path
   */
  constructor(buildFile, path) {
    this.buildFile = buildFile;
    this.path = path;
  }

  get available() {
    return existsSync(this.buildFilePath);
  }

  /**
   * @returns {string}
   */
  get buildFilePath() {
    return join(this.path, this.buildFile);
  }
}

module.exports = BuildToolInstallerBase;
