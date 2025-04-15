import { readFile, stat } from 'node:fs/promises';
import { isCodedError, mtime, verbose } from '../utils';
import { isAbsolute, join } from 'node:path';
import assert from 'node:assert';
import { PathLike } from 'node:fs';

type ClassEntry = {
  location: string;
  children?: ClassEntry[];
};

// Gets the file path of a location. Location may include a line number or other info
// in addition to the file path.
const parseFilePath = (location: string) => location.split(':')[0];

export interface AppMapIndex {
  updatedAt(appmapName: string): Promise<number | undefined>;

  classMap(appmapName: string): Promise<ClassEntry[]>;
}

class FileAppMapIndex implements AppMapIndex {
  async updatedAt(appmapName: string): Promise<number | undefined> {
    try {
      return (await stat(join(appmapName, 'mtime'))).mtimeMs;
    } catch (err) {
      if (!isCodedError(err)) console.warn(err);
      if (isCodedError(err) && err.code !== 'ENOENT') console.warn(err);
      return;
    }
  }

  async classMap(appmapName: string): Promise<ClassEntry[]> {
    return JSON.parse(await readFile(join(appmapName, 'classMap.json'), 'utf-8'));
  }
}

export default class UpToDate {
  public baseDir: string | undefined;
  public testFunction: ((sourceFilePath: string) => Promise<boolean>) | undefined;
  public appMapIndex: AppMapIndex = new FileAppMapIndex();
  public mtime: (path: PathLike) => Promise<number | undefined> = mtime;

  private mtimes = new Map<string, number | false>();
  public mtimeLookupCount = 0;
  public mtimeCacheHits = 0;

  async isOutOfDate(appmapName: string): Promise<undefined | Set<string>> {
    assert(!appmapName.endsWith('.appmap.json'), 'appmapName should not end with .appmap.json');

    const appmapUpdatedAt = await this.appMapIndex.updatedAt(appmapName);
    if (appmapUpdatedAt === undefined) {
      if (verbose()) console.warn(`[UpToDate] Update time for ${appmapName} cannot be determined`);
      return;
    }

    if (verbose()) {
      console.log(`[UpToDate] Checking AppMap ${appmapName} with timestamp ${appmapUpdatedAt}`);
    }

    const outOfDateNames = new Set<string>();
    const reportOutOfDate = (filePath: string) => {
      if (verbose()) console.log(`[UpToDate] ${filePath} requires rebuild of AppMap ${appmapName}`);

      outOfDateNames.add(filePath);
    };

    const classMap: ClassEntry[] = await this.appMapIndex.classMap(appmapName);
    const codeLocations = new Set<string>();
    const collectFilePaths = (classEntry: ClassEntry) => {
      if (classEntry.location) {
        const filePath = parseFilePath(classEntry.location);
        codeLocations.add(filePath);
      }
      if (classEntry.children) classEntry.children.forEach(collectFilePaths);
    };
    classMap.forEach(collectFilePaths);

    const modifiedTime = async (sourceFilePath: string): Promise<number | false> => {
      const result = this.mtimes.get(sourceFilePath);
      if (result || result === false) {
        this.mtimeCacheHits++;
        return result;
      }

      // Eleswhere, we are dealing with logical file names. But here, we need to resolve
      // the file path to the actual file system path.
      const resolvedFilePath = this.resolveFilePath(sourceFilePath);
      const dependencyModifiedAt = (await this.mtime(resolvedFilePath)) || false;
      this.mtimeLookupCount++;

      if (dependencyModifiedAt === false && verbose())
        console.log(`[UpToDate] ${sourceFilePath} does not exist`);

      this.mtimes.set(sourceFilePath, dependencyModifiedAt);
      return dependencyModifiedAt;
    };

    const isFileModifiedSince = async (sourceFilePath: string) => {
      const dependencyModifiedAt = await modifiedTime(sourceFilePath);
      if (dependencyModifiedAt === false) return dependencyModifiedAt;

      const outOfDate = appmapUpdatedAt < dependencyModifiedAt;
      if (outOfDate && verbose()) {
        console.log(
          `[UpToDate] ${appmapName} (${appmapUpdatedAt}) is NOT up to date with ${sourceFilePath} (${dependencyModifiedAt})`
        );
      }

      return outOfDate;
    };

    const test = this.testFunction || isFileModifiedSince;
    await Promise.all(
      [...codeLocations].map(async (sourceFilePath) => {
        if (await test(sourceFilePath)) {
          if (verbose())
            console.debug(`[UpToDate] ${appmapName} is out of date due to ${sourceFilePath}`);
          reportOutOfDate(sourceFilePath);
        }
      })
    );

    return outOfDateNames.size > 0 ? outOfDateNames : undefined;
  }

  /**
   * Prepend the baseDir to filePath, unless filePath is absolute.
   *
   * @param {string} filePath
   * @returns string
   */
  private resolveFilePath(filePath: string) {
    if (!this.baseDir) return filePath;

    if (isAbsolute(filePath)) return filePath;

    return join(this.baseDir, filePath);
  }
}
