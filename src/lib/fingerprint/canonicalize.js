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
  return algorithm.default(appmap);
}
