// Returns whether or not the given value is deeply empty.
// `maxDepth` is the maximum number of levels to recurse into.
// e.g.:
//   isEmpty({ a: undefined, b: null, c: false }) === true
//   isEmpty(['']) === true
const isEmpty = (value: unknown, maxDepth = 1): boolean => {
  // If we made it beyond the max depth, we're done. Consider this value NOT empty.
  if (maxDepth < 0) return false;

  if (value === undefined || value === null) return true;

  if (typeof value === 'string') return value.trim().length === 0;

  if (Array.isArray(value)) {
    // Recursively check each element.
    // For example, [''] is considered empty.
    return value.length === 0 || value.every((v) => isEmpty(v, maxDepth - 1));
  }

  if (typeof value === 'object') {
    // Recursively check each key-value pair.
    // For example, {example: undefined} is considered empty.
    return (
      Object.keys(value).length === 0 || Object.values(value).every((v) => isEmpty(v, maxDepth - 1))
    );
  }

  return false;
};

export default isEmpty;
