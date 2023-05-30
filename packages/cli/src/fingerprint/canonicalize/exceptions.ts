import { AppMap, Event } from '@appland/models';
import Unique from './unique';
import { isAbsolute, relative } from 'path';

/**
 * Collect unique exceptions.
 */
class Canonicalize extends Unique {
  /**
   *
   * @param {Event} event
   */
  functionCall(event: Event) {
    const { exceptions } = event;
    if (!exceptions || exceptions.length === 0) return;

    return exceptions
      .map((exception) => {
        const exceptionData = { ...exception };
        delete exceptionData['object_id'];

        let { path, lineno } = exceptionData;
        if (path) {
          if (isAbsolute(path)) path = relative(process.cwd(), path);
          delete exceptionData['path'];
          delete exceptionData['lineno'];
          exceptionData['location'] = [path, lineno].filter(Boolean).join(':');
        }

        return exceptionData;
      })
      .filter(Boolean);
  }
}

export default function canonicalize(appmap: AppMap) {
  return new Canonicalize(appmap).execute();
}
