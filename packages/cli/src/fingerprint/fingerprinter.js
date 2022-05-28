const { createHash } = require('crypto');
const { join: joinPath } = require('path');
const fsp = require('fs').promises;
const semver = require('semver');
const { buildAppMap } = require('@appland/models');
const writeFileAtomic = require('write-file-atomic');

const { verbose, baseName, ctime } = require('../utils');
const { algorithms, canonicalize } = require('./canonicalize');

/**
 * CHANGELOG
 *
 * # 1.1.1
 *
 * * Fix parent assignment algorithm.
 *
 * # 1.1.0
 *
 * * Add httpClientRequests, httpServerRequests, labels, sqlNormalized, sqlTables.
 * * Add database_type to CodeObjectType.QUERY and store in metadata.json.
 * * Fix handling of parent assignment in normalization.
 * * sql can contain the analysis (action, tables, columns), and/or the normalized query string.
 */
const VERSION = '1.1.1';

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
    const appMapCreatedAt = await ctime(appMapFileName);
    if (!appMapCreatedAt) {
      return;
    }

    if (verbose()) {
      console.warn(`Fingerprinting ${appMapFileName}`);
    }

    const indexDir = baseName(appMapFileName);
    const mtimeFileName = joinPath(indexDir, 'mtime');
    const versionFileName = joinPath(indexDir, 'version');

    const versionUpToDate = async () => {
      let versionStr = '0.0.1';
      try {
        versionStr = await fsp.readFile(versionFileName);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
      }
      versionStr = versionStr.toString().trim();
      if (verbose()) {
        console.warn(`${appMapFileName} index version is ${versionStr}`);
      }
      return semver.satisfies(versionStr, `>= ${VERSION}`);
    };
    const indexUpToDate = async () => {
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
      return indexedAt >= appMapCreatedAt;
    };

    if ((await versionUpToDate()) && (await indexUpToDate())) {
      if (verbose()) {
        console.warn('Fingerprint is up to date. Skipping...');
      }
      return;
    }

    let data;
    try {
      data = await fsp.readFile(appMapFileName);
    } catch (e) {
      if (e.code !== 'ENOENT') {
        console.warn(`${appMapFileName} does not exist. Skipping...`);
        return;
      }
      throw e;
    }

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

    await fsp.mkdir(indexDir, { recursive: true });

    await Promise.all(
      Object.keys(algorithms).map(async (algorithmName) => {
        const canonicalForm = canonicalize(algorithmName, appmap);
        const canonicalJSON = JSON.stringify(canonicalForm, null, 2);

        if (this.printCanonicalAppMaps) {
          await writeFileAtomic(
            joinPath(indexDir, `canonical.${algorithmName}.json`),
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

    appmapData.metadata.fingerprints.sort((a, b) =>
      a.canonicalization_algorithm.localeCompare(b.canonicalization_algorithm)
    );

    await writeFileAtomic(appMapFileName, JSON.stringify(appmapData, null, 2));
    const appMapIndexedAt = await ctime(appMapFileName);
    await writeFileAtomic(joinPath(indexDir, 'ctime'), `${appMapCreatedAt}`);
    await writeFileAtomic(joinPath(indexDir, 'version'), VERSION);
    await writeFileAtomic(
      joinPath(indexDir, 'classMap.json'),
      JSON.stringify(appmap.classMap, null, 2)
    );
    await writeFileAtomic(
      joinPath(indexDir, 'metadata.json'),
      JSON.stringify(appmap.metadata, null, 2)
    );

    // NOTE: mtime needs to be written last.
    // Downstream code will watch for this file and assume
    // indexing is complete once it changes.
    await writeFileAtomic(joinPath(indexDir, 'mtime'), `${appMapIndexedAt}`);
    this.counterFn();
  }
}

module.exports = Fingerprinter;
