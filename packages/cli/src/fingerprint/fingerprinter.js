const { createHash } = require('crypto');
const { join: joinPath } = require('path');
const fsp = require('fs').promises;
const { buildAppMap } = require('@appland/models');

const {
  verbose,
  baseName,
  buildDirectory,
  mtime,
  renameFile,
} = require('../utils');
const { algorithms, canonicalize } = require('./canonicalize');

class Fingerprinter {
  /**
   * @param {boolean} printCanonicalAppMaps
   */
  constructor(printCanonicalAppMaps) {
    this.printCanonicalAppMaps = printCanonicalAppMaps;
    this.counterFn = () => {};
  }

  setCounterFn(counterFn) {
    this.counterFn = counterFn;
  }

  // eslint-disable-next-line class-methods-use-this
  async fingerprint(appMapFileName) {
    if (verbose()) {
      console.warn(`Fingerprinting ${appMapFileName}`);
    }

    const indexDir = baseName(appMapFileName);
    const mtimeFileName = joinPath(indexDir, 'mtime');
    const appMapCreatedAt = await mtime(appMapFileName);

    let indexedAt = 0;
    try {
      const indexedAtStr = await fsp.readFile(mtimeFileName);
      indexedAt = parseInt(indexedAtStr, 10);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }

    if (verbose()) {
      console.warn(
        `${appMapFileName} created at ${appMapCreatedAt}, indexed at ${indexedAt}`
      );
    }
    if (indexedAt === appMapCreatedAt) {
      if (verbose()) {
        console.warn('Fingerprint is up to date. Skipping...');
      }
      return;
    }

    const data = await fsp.readFile(appMapFileName);
    if (verbose()) {
      console.warn(`Read ${data.length} bytes`);
    }

    let appmapData;
    try {
      appmapData = JSON.parse(data.toString());
    } catch (err) {
      if (err instanceof SyntaxError) {
        // File may be in the process of writing.
        console.warn(
          `Error parsing JSON file ${appMapFileName} : ${err.message}`
        );
        return;
      }
      throw err;
    }
    if (!appmapData.metadata) {
      if (verbose()) {
        console.warn(`${appMapFileName} has no metadata. Skipping...`);
      }
      return;
    }

    const appmapDataWithoutMetadata = JSON.parse(data.toString());
    delete appmapDataWithoutMetadata.metadata;
    const appmapDigest = createHash('sha256')
      .update(JSON.stringify(appmapDataWithoutMetadata, null, 2))
      .digest('hex');

    const fingerprints = [];
    appmapData.metadata.fingerprints = fingerprints;
    const appmap = buildAppMap(appmapData).normalize().build();

    await buildDirectory(indexDir, async (tempDir) => {
      await Promise.all(
        Object.keys(algorithms).map(async (algorithmName) => {
          const canonicalForm = canonicalize(algorithmName, appmap);
          const canonicalJSON = JSON.stringify(canonicalForm, null, 2);

          if (this.printCanonicalAppMaps) {
            await fsp.writeFile(
              joinPath(tempDir, `canonical.${algorithmName}.json`),
              canonicalJSON
            );
          }

          const fingerprintDigest = createHash('sha256')
            .update(canonicalJSON)
            .digest('hex');
          if (verbose()) {
            console.warn(`Computed digest for ${algorithmName}`);
          }
          fingerprints.push({
            appmap_digest: appmapDigest,
            canonicalization_algorithm: algorithmName,
            digest: fingerprintDigest,
            fingerprint_algorithm: 'sha256',
          });
        })
      );

      await fsp.writeFile(
        joinPath(tempDir, 'appmap.json'),
        JSON.stringify(appmapData, null, 2)
      );
      await renameFile(joinPath(tempDir, 'appmap.json'), appMapFileName);
      const appMapIndexedAt = await mtime(appMapFileName);
      await fsp.writeFile(joinPath(tempDir, 'mtime'), `${appMapIndexedAt}`);
      await fsp.writeFile(
        joinPath(tempDir, 'metadata.json'),
        JSON.stringify(appmap.metadata, null, 2)
      );
      await fsp.writeFile(
        joinPath(tempDir, 'classMap.json'),
        JSON.stringify(appmap.classMap, null, 2)
      );
    });
    this.counterFn();
  }
}

module.exports = Fingerprinter;
