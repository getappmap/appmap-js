/* eslint-disable class-methods-use-this */
const { analyzeQuery } = require('../../database');
const Base = require('./base');

/**
 * At DEBUG level, the order of labeled function calls matters, and all function class
 * and method names are retained. SQL queries are also retained in order.
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
      mime_type: event.httpServerResponse
        ? event.httpServerResponse.mime_type
        : null,
      parameters: event.httpServerRequest
        ? event.httpServerRequest.message
        : null,
      route: event.route,
      status: event.httpServerResponse ? event.httpServerResponse.status : null,
    };
  }

  functionCall(event) {
    return {
      id: event.id,
      parent_id: event.parent ? event.parent.id : null,
      kind: 'function',
      function: event.codeObject.id,
      labels: [...event.codeObject.labels],
    };
  }
}

module.exports = (appmap) => new Canonicalize(appmap).execute();
