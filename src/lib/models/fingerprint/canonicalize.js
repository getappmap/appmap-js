/**
 * Process an appmap into a canonical form which can be fingerprinted
 * by converting it to a byte sequence such as YAML or JSON.
 *
 * To canonicalize an appmap, the events are processed in order and transformed
 * according a defined set of rules. Some events are compacted and others are ignored.
 * Highly transient values such as object ids and thread ids are always discarded.
 */
export default async function (algorithmName, appmap) {
  const algorithm = await import(`./${algorithmName}`);

  // TODO: In the Trace view, when an event list contains HTTP server requests there is
  // special treatment. The displayed tree roots are the HTTP server requests, and other
  // events that lie outside those requests (such as test fixture activity) are not shown
  // at all. If we want to treat the appmap that way for canonicalization purposes, this
  // is the place to do it.
  return algorithm.default(appmap);
}
