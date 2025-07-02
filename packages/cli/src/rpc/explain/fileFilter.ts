import { FilterFn, isBinaryFile, isDataFile, isLargeFile } from '@appland/search';
import makeDebug from 'debug';
import { fileNameMatchesFilterPatterns } from './index/filter-patterns';

const debug = makeDebug('appmap:rpc:explain:file-filter');

export default function fileFilter(
  includePatterns: RegExp[] | undefined,
  excludePatterns: RegExp[] | undefined
): FilterFn {
  return async (path: string) => {
    debug('Filtering: %s', path);
    if (await isBinaryFile(path)) {
      debug('Skipping binary file: %s', path);
      return false;
    }

    const includeFile = fileNameMatchesFilterPatterns(path, includePatterns, excludePatterns);
    if (!includeFile) return false;

    const isData = isDataFile(path);
    if (isData && (await isLargeFile(path))) {
      debug('Skipping large data file: %s', path);
      return false;
    }

    return true;
  };
}
