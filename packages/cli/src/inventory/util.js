// eslint-disable-next-line no-inner-declarations
function textIfy(entry) {
  // eslint-disable-next-line no-param-reassign
  entry = JSON.parse(entry);
  if (typeof entry === 'string') {
    return entry.trim();
  }
  if (Array.isArray(entry)) {
    return entry.map((l) => l.trim()).join(' -> ');
  }
  if (entry.route) {
    return `${entry.route} ${entry.status} (${entry.parameters.join(',')})`;
  }
  if (entry.caller) {
    return [entry.caller, entry.callee].join(' -> ');
  }
  return Object.keys(entry)
    .reduce((memo, key) => {
      memo.push(`${key}=${entry[key]}`);
      return memo;
    }, [])
    .join(',');
}

module.exports = { textIfy };
