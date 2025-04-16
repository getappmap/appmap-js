import assert from 'assert';
import { mkdir, readFile, stat as fStat } from 'fs/promises';
import { join } from 'path';
import { satisfies as versionSatisfies } from 'semver';
import { baseName, mtime, verbose, writeFileAtomic } from '../utils';

/**
 * Raw AppMaps are processed into an index, which consists of:
 *
 * * `the-appmap.appmap.json` Canonicalized AppMap file (replaces the original AppMap).
 * * `the-appmap/version` Identifies the index algorithm version.
 * * `the-appmap/classMap.json` 'classMap' object extracted from the AppMap.
 * * `the-appmap/metadata.json` 'metadata' object extracted from the AppMap.
 * * `the-appmap/mtime` Time at which the AppMap was indexed.
 *
 * Other optional fields may be present as well.
 */
export default class AppMapIndex {
  indexDir: string;
  appmapCreatedAt?: number;
  size?: number;

  /**
   * Constructs a new AppMapIndex. After calling the constructor, call `initialize`.
   *
   * @param appmapFileName The path to the AppMap file.
   * @see initialize
   */
  constructor(public appmapFileName: string) {
    this.indexDir = baseName(appmapFileName);
  }

  /**
   * Performs async operations needed to initialize the index. If this method returns false,
   * abort.
   */
  async initialize(): Promise<boolean> {
    const stats = await fStat(this.appmapFileName);
    // note ENOENT and similar errors should be handled upstream
    if (!stats.isFile()) return false;
    this.appmapCreatedAt = stats.mtimeMs;
    this.size = stats.size;

    return true;
  }

  /**
   * Creates the index directory that will contain the processed files.
   */
  async mkdir_p(): Promise<void> {
    await mkdir(this.indexDir, { recursive: true });
  }

  /**
   * Creates a data file within the index directory.
   *
   * @param fileName The name of the file to write within the index directory.
   * @param data Raw data to store.
   */
  async writeFileAtomic(fileName: string, data: string): Promise<void> {
    assert(this.appmapCreatedAt);
    await writeFileAtomic(this.indexDir, fileName, this.appmapCreatedAt.toString(), data);
  }

  /**
   * Loads the raw AppMap data that will be indexed.
   *
   * @returns the raw data of the AppMap file.
   */
  async loadAppMapData(): Promise<any | undefined> {
    let appmapStr: string;
    try {
      appmapStr = await readFile(this.appmapFileName, 'utf-8');
    } catch (e) {
      if ((e as any).code === 'ENOENT') {
        console.log(`${this.appmapFileName} does not exist.`);
        return;
      }

      throw e;
    }

    if (verbose()) {
      console.log(`Read ${appmapStr.length} bytes from ${this.appmapFileName}`);
    }

    let appmapData: any;
    try {
      appmapData = JSON.parse(appmapStr);
    } catch (err) {
      if (err instanceof SyntaxError) {
        // File may be in the process of writing.
        console.warn(`Error parsing JSON file ${this.appmapFileName} : ${err.message}`);
        return;
      }

      throw err;
    }

    if (!appmapData.metadata) {
      if (verbose()) {
        console.warn(`${this.appmapFileName} has no metadata. Skipping...`);
      }
      return;
    }

    return appmapData;
  }

  /**
   * @returns number of bytes in the AppMap.
   */
  public appmapFileSize(): number {
    assert(this.size);
    return this.size;
  }

  /**
   * Tests whether the existing index is using the current algorithm.
   *
   * @param requiredVersion The current version of the index algorithm.
   */
  async versionUpToDate(requiredVersion: string): Promise<boolean> {
    const versionFileName = join(this.indexDir, 'version');
    let versionStr: string | undefined;
    try {
      versionStr = await readFile(versionFileName, 'utf-8');
    } catch (err) {
      if ((err as any).code !== 'ENOENT') {
        throw err;
      }
    }
    if (!versionStr) return false;

    versionStr = versionStr.trim();
    if (verbose()) {
      console.log(`${this.indexDir} index version is ${versionStr}`);
    }
    return versionSatisfies(versionStr, `>= ${requiredVersion}`);
  }

  /**
   * Tests whether the existing index is up to date with the raw AppMap data.
   */
  async indexUpToDate(): Promise<boolean> {
    assert(this.appmapCreatedAt, `AppMap index is not initialized`);

    const mtimeFileName = join(this.indexDir, 'mtime');

    const indexedAt = await mtime(mtimeFileName);
    if (!indexedAt) return false;

    if (verbose()) {
      console.log(`${this.indexDir} created at ${this.appmapCreatedAt}, indexed at ${indexedAt}`);
    }
    return indexedAt >= this.appmapCreatedAt;
  }
}
