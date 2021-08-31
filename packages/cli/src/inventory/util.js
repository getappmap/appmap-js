// eslint-disable-next-line no-inner-declarations
function textIfy(entry, parse = true) {
  // eslint-disable-next-line no-param-reassign
  if (parse) {
    // eslint-disable-next-line no-param-reassign
    entry = JSON.parse(entry);
  }
  if (typeof entry === 'string') {
    return entry.trim();
  }
  if (Array.isArray(entry)) {
    return entry.map((e) => textIfy(e, false)).join(' -> ');
  }
  if (entry.infoFingerprint) {
    return [entry.name, `(${entry.fileName})`].join(' ');
  }
  if (entry.route) {
    const hasRailsParams =
      entry.parameters.includes('action') &&
      entry.parameters.includes('controller');
    const parameters = entry.parameters.filter(
      (p) => !hasRailsParams || (p !== 'action' && p !== 'controller')
    );
    return [entry.route, entry.status, `(${parameters.join(',')})`].join(' ');
  }
  if (entry.query) {
    return entry.query;
  }
  if (entry.function) {
    return entry.function;
  }
  if (entry.caller) {
    return [entry.caller, entry.callee].join(' -> ');
  }
  if (entry.labels) {
    return entry.labels.map((label) => ['@', label].join('')).join(',');
  }
  return Object.keys(entry)
    .reduce((memo, key) => {
      memo.push(`${key}=${entry[key]}`);
      return memo;
    }, [])
    .join(',');
}

// http://127.0.0.1:9516/session/69857e75c343c04e3dd841fb656156c9/element/87f74064-ff83-44b0-ac20-05cce2951c71
const SeleniumClientRegexp = /http:\/\/127.0.0.1:\d+\/session\/[a-f0-9]+\//;

module.exports = { textIfy, SeleniumClientRegexp };
