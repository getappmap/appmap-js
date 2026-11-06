/** Public identity limits: root depth is zero; every value counts as one node. */
export const COMPARISON_IDENTITY_MAX_DEPTH = 64;
export const COMPARISON_IDENTITY_MAX_NODES = 10000;

/** Strict canonical JSON, without toJSON coercion, getters or lossy omissions. */
export function canonicalComparisonIdentity(identity: unknown): string {
  const ancestors = new Set<object>();
  let nodes = 0;
  function encode(value: unknown, depth: number): string {
    if (depth > COMPARISON_IDENTITY_MAX_DEPTH)
      throw new TypeError('Comparison identity depth limit exceeded');
    if (++nodes > COMPARISON_IDENTITY_MAX_NODES)
      throw new TypeError('Comparison identity node limit exceeded');
    if (value === null) return 'null';
    if (typeof value === 'number' && !Number.isFinite(value))
      throw new TypeError('Comparison identities require finite numbers');
    if (['string', 'boolean', 'number'].includes(typeof value)) return JSON.stringify(value);
    if (typeof value !== 'object')
      throw new TypeError(`Comparison identities cannot contain ${typeof value}`);
    const object = value;
    const array = Array.isArray(object);
    const prototype: unknown = Object.getPrototypeOf(object);
    if (
      (array && prototype !== Array.prototype) ||
      (!array && prototype !== Object.prototype && prototype !== null)
    )
      throw new TypeError('Comparison identities require plain JSON objects');
    if (ancestors.has(object)) throw new TypeError('Comparison identity contains a cycle');
    if (array && (object as unknown[]).length > COMPARISON_IDENTITY_MAX_NODES - nodes)
      throw new TypeError('Comparison identity node limit exceeded');
    const keys = Reflect.ownKeys(object);
    if (keys.length - (array ? 1 : 0) > COMPARISON_IDENTITY_MAX_NODES - nodes)
      throw new TypeError('Comparison identity node limit exceeded');
    if (keys.some((key) => typeof key !== 'string'))
      throw new TypeError('Comparison identities cannot contain symbol keys');
    const names = (keys as string[]).filter((key) => !(array && key === 'length'));
    if (
      array &&
      (names.length !== (object as unknown[]).length ||
        names.some((key, index) => key !== String(index)))
    )
      throw new TypeError('Comparison identities require dense arrays without extra properties');
    ancestors.add(object);
    const entries = (array ? names : names.sort()).map((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(object, key)!;
      if (!descriptor.enumerable || !('value' in descriptor))
        throw new TypeError('Comparison identities require enumerable data properties');
      const encoded = encode(descriptor.value, depth + 1);
      return array ? encoded : `${JSON.stringify(key)}:${encoded}`;
    });
    ancestors.delete(object);
    return array ? `[${entries.join(',')}]` : `{${entries.join(',')}}`;
  }
  return encode(identity, 0);
}
