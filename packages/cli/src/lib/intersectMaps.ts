/** Creates a map that only contains entries that exist in all arguments. */
export function intersectMaps<K, V>(...maps: Map<K, V>[]): Map<K, V> {
  const first = maps.shift();
  if (!first) return new Map();

  const result = new Map(first.entries());

  for (const map of maps)
    for (const [k, v] of map.entries()) if (result.get(k) !== v) result.delete(k);

  return result;
}
