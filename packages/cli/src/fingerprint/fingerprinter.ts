import { createHash } from 'crypto';
import { join as joinPath, basename } from 'path';
import { promises as fsp } from 'fs';
import { buildAppMap } from '@appland/models';
import assert from 'assert';
import FileTooLargeError from './fileTooLargeError';

import { verbose, mtime } from '../utils';
import { algorithms, canonicalize } from './canonicalize';
import AppMapIndex from './appmapIndex';

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
const VERSION = '1.1.3';

const MAX_APPMAP_SIZE = 50 * 1000 * 1000;

export type Fingerprint = {
  appmap_digest: string;
  canonicalization_algorithm: string;
  digest: string;
  fingerprint_algorithm: 'sha256';
};

export default class Fingerprinter {
  /**
   * @param {boolean} printCanonicalAppMaps
   */
  constructor(private printCanonicalAppMaps: boolean) {
    this.counterFn = () => {};
  }

  private counterFn: () => void;

  setCounterFn(counterFn: () => void) {
    this.counterFn = counterFn;
  }

  // eslint-disable-next-line class-methods-use-this
  async fingerprint(appMapFileName: string) {
    if (verbose()) {
      console.log(`Fingerprinting ${appMapFileName}`);
    }

    const index = new AppMapIndex(appMapFileName);
    if (!(await index.initialize())) {
      return;
    }

    if ((await index.versionUpToDate(VERSION)) && (await index.indexUpToDate())) {
      if (verbose()) {
        console.log('Fingerprint is up to date. Skipping...');
      }
      return;
    }

    if ((await index.appmapFileSize()) > MAX_APPMAP_SIZE)
      throw new FileTooLargeError(appMapFileName, await index.appmapFileSize(), MAX_APPMAP_SIZE);

    const appmapData = await index.loadAppMapData();
    if (!appmapData) return;

    const appmapDataWithoutMetadata = await index.loadAppMapData();
    if (!appmapDataWithoutMetadata) return;

    delete appmapDataWithoutMetadata.metadata;
    const appmapDigest = createHash('sha256')
      .update(JSON.stringify(appmapDataWithoutMetadata, null, 2))
      .digest('hex');

    const fingerprints: Fingerprint[] = [];
    appmapData.metadata.fingerprints = fingerprints;

    const appmap = buildAppMap(appmapData).normalize().build();

    await index.mkdir_p();

    await Promise.all(
      Object.keys(algorithms).map(async (algorithmName) => {
        const canonicalForm = canonicalize(algorithmName, appmap);
        const canonicalJSON = JSON.stringify(canonicalForm, null, 2);

        if (this.printCanonicalAppMaps) {
          await index.writeFileAtomic(`canonical.${algorithmName}.json`, canonicalJSON);
        }

        const fingerprintDigest = createHash('sha256').update(canonicalJSON).digest('hex');
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

    const tempAppMapFileName = joinPath(index.indexDir, 'appmap.tmp');
    await index.writeFileAtomic(basename(tempAppMapFileName), JSON.stringify(appmap, null, 2));
    const appMapIndexedAt = await mtime(tempAppMapFileName);

    assert(appMapIndexedAt, `${tempAppMapFileName} should always exist and be a readable file`);

    await Promise.all([
      index.writeFileAtomic('version', VERSION),
      index.writeFileAtomic('classMap.json', JSON.stringify(appmap.classMap, null, 2)),
      index.writeFileAtomic('metadata.json', JSON.stringify(appmap.metadata, null, 2)),
      index.writeFileAtomic('mtime', `${appMapIndexedAt}`),
    ]);

    // At this point, moving the AppMap file into place will trigger re-indexing.
    // But the mtime will match the file modification time, so the algorithm will
    // determine that the index is up-to-date.
    await fsp.rename(tempAppMapFileName, appMapFileName);

    this.counterFn();
  }
}
