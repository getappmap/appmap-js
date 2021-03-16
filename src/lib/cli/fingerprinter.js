const { createHash } = require('crypto');
const { join: joinPath, basename } = require('path');
const fsp = require('fs').promises;
const { verbose, baseName, buildDirectory, renameFile } = require('./utils');
const {
  algorithms,
  canonicalize,
  buildAppMap,
} = require('../../../dist/appmap.node');

class Fingerprinter {
  constructor(printCanonicalAppMaps) {
    this.printCanonicalAppMaps = printCanonicalAppMaps;
    this.counterFn = () => {};
  }

  setCounterFn(counterFn) {
    this.counterFn = counterFn;
  }

  // eslint-disable-next-line class-methods-use-this
  async fingerprint(file) {
    if (verbose()) {
      console.info(`Fingerprinting ${file}`);
    }

    const indexDir = baseName(file);
    const mtimeFileName = joinPath(indexDir, 'mtime');

    let fileStat = await fsp.stat(file);
    const createdAt = fileStat.ctime.getTime();
    let recordedCreatedAt = 0;
    try {
      const recordedCreatedAtStr = JSON.parse(
        await fsp.readFile(mtimeFileName)
      );
      recordedCreatedAt = parseInt(recordedCreatedAtStr, 10);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }

    if (recordedCreatedAt === createdAt) {
      if (verbose()) {
        console.log('Fingerprints appear up to date. Skipping...');
      }
      return;
    }

    const data = await fsp.readFile(file);
    if (verbose()) {
      console.log(`Read ${data.length} bytes`);
    }

    let appmapData;
    try {
      appmapData = JSON.parse(data.toString());
    } catch (err) {
      if (err instanceof SyntaxError) {
        // File may be in the process of writing.
        console.warn(`Error parsing JSON file ${file} : ${err.message}`);
        return;
      }
      throw err;
    }
    if (!appmapData.metadata) {
      if (verbose()) {
        console.info(`${file} has no metadata. Skipping...`);
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
            console.log(`Computed digest for ${algorithmName}`);
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
      await renameFile(joinPath(tempDir, 'appmap.json'), file);
      fileStat = await fsp.stat(file);
      await fsp.writeFile(
        joinPath(tempDir, 'mtime'),
        `${fileStat.ctime.getTime()}`
      );
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
