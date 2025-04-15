/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { resolve } from 'path';
import { buildAppMap, Metadata } from '@appland/models';
import assert from 'assert';
import FileTooLargeError from './fileTooLargeError';

import { verbose } from '../utils';
import { algorithms, canonicalize } from './canonicalize';
import AppMapIndex from './appmapIndex';
import EventEmitter from 'events';
import quotePath from '../lib/quotePath';

/**
 * CHANGELOG
 *
 * * # 1.4.0
 *
 * * Include parameter names in the index.
 *
 * * # 1.3.0
 *
 * * Include exceptions in the index.
 *
 * # 1.2.0
 *
 * * Drop fingerprint fields, as these are no longer used by downstream tools.
 *   Canonicalization via sequence diagram is now the preferred mechanism.
 *
 * # 1.1.4
 *
 * * Add missing status_code to normalized AppMaps.
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
export const VERSION = '1.4.0';

const MAX_APPMAP_SIZE = 50 * 1024 * 1024;

export type Fingerprint = {
  appmap_digest: string;
  canonicalization_algorithm: string;
  digest: string;
  fingerprint_algorithm: 'sha256';
};

class Fingerprinter extends EventEmitter {
  /**
   * Whether to check if the version of the existing index is up to date.
   * When watching files for changes, it can be set to false after the initial
   * pass to avoid re-reading the same 'version' files over and over.
   */
  public checkVersion = true;
  public maxFileSizeInBytes: number | undefined = MAX_APPMAP_SIZE;

  async fingerprint(appMapFileName: string): Promise<FingerprintEvent | undefined> {
    if (verbose()) {
      console.log(`Indexing ${appMapFileName}`);
    }

    const index = new AppMapIndex(appMapFileName);
    if (!(await index.initialize())) {
      return;
    }

    const mtime = index.appmapCreatedAt;
    assert(mtime);

    if (
      (!this.checkVersion || (await index.versionUpToDate(VERSION))) &&
      (await index.indexUpToDate())
    ) {
      if (verbose()) {
        console.log('Index is up to date. Skipping...');
      }
      return;
    }

    if (this.maxFileSizeInBytes && index.appmapFileSize() > this.maxFileSizeInBytes)
      throw new FileTooLargeError(appMapFileName, index.appmapFileSize(), this.maxFileSizeInBytes);

    const appmapData = await index.loadAppMapData();
    if (!appmapData) return;

    const appmap = buildAppMap(appmapData).normalize().build();
    const numEvents = appmap.events.length;

    // This field is deprecated, because for some change sets the Git status may be large and unweildy.
    // It's also not used anywhere else in the system, so we can just drop it.
    // Because the Git status field is optional anyway, the index version is not being changed for this.
    if (appmap?.metadata?.git?.status) {
      const git = appmap.metadata.git;
      delete (git as any)['status'];
    }

    await index.mkdir_p();

    await Promise.all(
      Object.keys(algorithms).map(async (algorithmName) => {
        const canonicalForm = canonicalize(algorithmName, appmap);
        const canonicalJSON = JSON.stringify(canonicalForm, null, 2);
        await index.writeFileAtomic(`canonical.${algorithmName}.json`, canonicalJSON);
      })
    );

    await Promise.all([
      index.writeFileAtomic('version', VERSION),
      index.writeFileAtomic('classMap.json', JSON.stringify(appmap.classMap, null, 2)),
      index.writeFileAtomic('metadata.json', JSON.stringify(appmap.metadata, null, 2)),
      index.writeFileAtomic('mtime', mtime.toString()),
    ]);

    // Note: don't remove or modify the output below,
    // it's machine-readable (see doc/index-verbose.md)
    if (verbose()) console.log(`Indexed ${quotePath(resolve(appMapFileName))}`);

    const result = { path: appMapFileName, metadata: appmap.metadata, numEvents };
    this.emit('index', result);
    return result;
  }
}

export type FingerprintEvent = {
  path: string;
  metadata: Metadata;
  numEvents: number;
};

interface Fingerprinter {
  on(event: 'index', listener: (data: FingerprintEvent) => void): this;
  emit(event: 'index', data: FingerprintEvent): boolean;
}

export default Fingerprinter;
