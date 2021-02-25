import fs from 'fs';
import { join as joinPath } from 'path';

// eslint-disable-next-line func-names
export const algorithms = (function () {
  const fullPath = (file) => joinPath(__dirname, 'canonicalize', file);
  const isFile = (file) => fs.statSync(fullPath(file)).isFile();
  const isJS = (file) => file.endsWith('.js');

  return fs
    .readdirSync(joinPath(__dirname, 'canonicalize'))
    .filter(isFile)
    .filter(isJS)
    .map((file) => file.slice(0, file.length - 3));
})();

/**
 * Process an appmap into a canonical form which can be fingerprinted
 * by converting it to a byte sequence such as YAML or JSON.
 *
 * To canonicalize an appmap, the events are processed in order and transformed
 * according a defined set of rules. Some events are compacted and others are ignored.
 * Highly transient values such as object ids and thread ids are always discarded.
 */
export async function canonicalize(algorithmName, appmap) {
  if (algorithms.indexOf(algorithmName) === -1) {
    throw new Error(`Invalid canonicalization algorithm: ${algorithmName}`);
  }

  const algorithm = await import(`./canonicalize/${algorithmName}`);

  // TODO: In the Trace view, when an event list contains HTTP server requests there is
  // special treatment. The displayed tree roots are the HTTP server requests, and other
  // events that lie outside those requests (such as test fixture activity) are not shown
  // at all. If we want to treat the appmap that way for canonicalization purposes, this
  // is the place to do it.
  return algorithm.default(appmap);
}
