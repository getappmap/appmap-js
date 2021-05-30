/* eslint-disable class-methods-use-this */
const { analyzeQuery } = require('../../database');
const Base = require('./base');

/**
 * At INFO level, the order of labeled function calls matters. SQL query strings
 * are collected, sorted and made unique.
 */
class Canonicalize extends Base {
  sql(event) {
    return {
      id: event.id,
      parent_id: event.parent ? event.parent.id : null,
      kind: 'sql',
      sql: analyzeQuery(event.sql),
    };
  }

  httpServerRequest(event) {
    return {
      id: event.id,
      parent_id: event.parent ? event.parent.id : null,
      kind: 'http_server_request',
      route: event.route,
      status: event.httpServerResponse ? event.httpServerResponse.status : null,
    };
  }

  functionCall(event) {
    if (event.codeObject.labels.size === 0) {
      return null;
    }

    return {
      id: event.id,
      parent_id: event.parent ? event.parent.id : null,
      kind: 'function',
      labels: [...event.codeObject.labels],
    };
  }
}

module.exports = (appmap) => new Canonicalize(appmap).execute();
