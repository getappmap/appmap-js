const { createHash } = require('crypto');
const { join: joinPath, basename } = require('path');
const fsp = require('fs').promises;
const semver = require('semver');
const { buildAppMap } = require('@appland/models');
const writeFileAtomic = require('write-file-atomic');
const { move } = require('fs-extra');
const assert = require('assert');
const { default: FileTooLargeError } = require('./fileTooLargeError');

const { verbose, baseName, mtime } = require('../utils');
const { algorithms, canonicalize } = require('./canonicalize');

/**
 * CHANGELOG
 *
 * # 1.1.3
 *
 * * Removed ctime file. Use mtime to determine when the AppMap was last updated.
 * * Use higher precision for mtime.
 *
 * # 1.1.2
 *
 * * Reject large appmaps to avoid running out of system resources trying to process them.
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
const VERSION = '1.1.2';

const MAX_APPMAP_SIZE = 50 * 1000 * 1000;

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
    const appMapCreatedAt = await mtime(appMapFileName);
    if (!appMapCreatedAt) {
      console.log(`File ${appMapFileName} does not exist or is not a file.`);
      return;
    }

    if (verbose()) {
      console.log(`Fingerprinting ${appMapFileName}`);
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
        console.log(`${appMapFileName} index version is ${versionStr}`);
      }
      return semver.satisfies(versionStr, `>= ${VERSION}`);
    };
    const indexUpToDate = async () => {
      let indexedAt = 0;
      try {
        const indexedAtStr = await fsp.readFile(mtimeFileName);
        indexedAt = parseFloat(indexedAtStr);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
      }

      if (verbose()) {
        console.log(
          `${appMapFileName} created at ${appMapCreatedAt}, indexed at ${indexedAt}`
        );
      }
      return indexedAt >= appMapCreatedAt;
    };

    if ((await versionUpToDate()) && (await indexUpToDate())) {
      if (verbose()) {
        console.log('Fingerprint is up to date. Skipping...');
      }
      return;
    }

    {
      const stat = await fsp.stat(appMapFileName);
      if (stat.size > MAX_APPMAP_SIZE)
        throw new FileTooLargeError(appMapFileName, stat.size, MAX_APPMAP_SIZE);
    }

    let data;
    try {
      data = await fsp.readFile(appMapFileName);
    } catch (e) {
      if (e.code !== 'ENOENT') {
        console.log(`${appMapFileName} does not exist. Skipping...`);
        return;
      }
      throw e;
    }

    if (verbose()) {
      console.log(`Read ${data.length} bytes`);
    }

    let appmapData;
    try {
      // TODO: Should we normalize, compress, etc here?
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

    const tempAppMapFileName = joinPath(
      indexDir,
      [basename(appMapFileName), 'tmp'].join('.')
    );
    await writeFileAtomic(
      tempAppMapFileName,
      JSON.stringify(appmapData, null, 2)
    );
    const appMapIndexedAt = await mtime(tempAppMapFileName);
    assert(
      appMapIndexedAt,
      `${tempAppMapFileName} should always exist and be a readable file`
    );
    await writeFileAtomic(joinPath(indexDir, 'version'), VERSION);
    await writeFileAtomic(
      joinPath(indexDir, 'classMap.json'),
      JSON.stringify(appmap.classMap, null, 2)
    );
    await writeFileAtomic(
      joinPath(indexDir, 'metadata.json'),
      JSON.stringify(appmap.metadata, null, 2)
    );

    await writeFileAtomic(joinPath(indexDir, 'mtime'), `${appMapIndexedAt}`);

    // At this point, moving the AppMap file into place will trigger re-indexing.
    // But the mtime will match the file modification time, so the algorithm will
    // determine that the index is up-to-date.
    await move(tempAppMapFileName, appMapFileName, { overwrite: true });

    this.counterFn();
  }
}

module.exports = Fingerprinter;
