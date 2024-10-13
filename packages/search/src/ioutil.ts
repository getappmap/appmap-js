import { readFileSync } from 'fs';
import makeDebug from 'debug';

const debug = makeDebug('appmap:search:ioutil');

export type ContentReader = (filePath: string) => PromiseLike<string | undefined>;

export function readFileSafe(filePath: string): PromiseLike<string | undefined> {
  try {
    return Promise.resolve(readFileSync(filePath, 'utf8'));
  } catch (error) {
    debug(`Error reading file: %s`, filePath);
    return Promise.resolve(undefined);
  }
}
