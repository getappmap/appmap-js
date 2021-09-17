const Base = require('./base');

function coalesce(data) {
  return data.reduce((memo, entry) => {
    if (!entry || !entry.id) {
      return memo;
    }

    if (!memo[entry.kind]) {
      memo[entry.kind] = {};
    }
    const ids = typeof entry.id === 'string' ? [entry.id] : entry.id;
    ids.forEach((id) => {
      if (!memo[entry.kind][id]) {
        memo[entry.kind][id] = [];
      }
      memo[entry.kind][id].push(entry.elapsed);
    });

    return memo;
  }, {});
}

class Canonicalize extends Base {
  constructor(appmap) {
    super(appmap, coalesce);
  }

  // eslint-disable-next-line class-methods-use-this
  transform(event) {
    if (!event.returnEvent) {
      return null;
    }

    const result = { elapsed: event.returnEvent.elapsed };
    if (event.sqlQuery) {
      result.kind = 'query';
      result.id = event.sqlQuery;
    }
    if (event.httpServerRequest) {
      result.kind = 'httpServerRequest';
      result.id = [
        event.route,
        event.httpServerResponse ? event.httpServerResponse.status_code : '?',
      ].join(' ');
    }
    if (event.htttpClientRequest) {
      result.kind = 'httpClientRequest';
      result.id = [
        event.route,
        event.returnEvent ? event.httpServerResponse.status_code : '?',
      ].join(' ');
    }
    if (event.labels && event.labels.length > 0) {
      result.kind = 'function';
      result.id = event.labels;
    }
    return result;
  }
}

module.exports = (appmap) => new Canonicalize(appmap).execute();
