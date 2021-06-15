/* eslint-disable max-classes-per-file */
// @ts-check

const glob = require('glob');
const { promises: fsp } = require('fs');

class LocalAppMapMetadata {
  constructor(appMapFileName, metadata) {
    this.appMapFileName = appMapFileName;
    this.metadata = metadata;
  }

  /**
   * @param {string} algorithm
   * @returns {string}
   */
  fingerprint(algorithm) {
    return this.metadata.fingerprints.find(
      (fingerprint) => fingerprint.canonicalization_algorithm === algorithm
    );
  }

  /**
   * @returns {Promise<AppMapData>}
   */
  async loadAppMapData() {
    const appMapFilePath = [this.appMapFileName, 'appmap.json'].join('.');
    return JSON.parse((await fsp.readFile(appMapFilePath)).toString());
  }
}

class LocalMapsetProvider {
  constructor(/** @type {string} */ directory) {
    this.directory = directory;
  }

  async appMaps() {
    const metadataFileNames = [];
    await new Promise((resolve, reject) => {
      // eslint-disable-next-line consistent-return
      glob(`${this.directory}/**/metadata.json`, (err, files) => {
        if (err) {
          return reject(err);
        }
        files.forEach((file) => metadataFileNames.push(file));
        resolve();
      });
    });
    return Promise.all(
      metadataFileNames.reduce(async (memo, metadataFileName) => {
        const metadata = JSON.parse(
          (await fsp.readFile(metadataFileName)).toString('utf-8')
        );
        const tokens = metadataFileName.split('/');
        tokens.pop();
        const fileName = tokens.join('/');
        return new LocalAppMapMetadata(fileName, metadata);
      })
    );
  }
}

module.exports = LocalMapsetProvider;
