/* eslint-disable class-methods-use-this */
const { analyzeQuery } = require('../../database');
const Base = require('./base');

/**
 * At TRACE level, the order of labeled function calls matters, and all function class
 * and method names are retained. SQL queries are also retained in order. HTTP
 * server and client request parameters are retained.
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

  httpClientRequest(event) {
    return {
      id: event.id,
      parent_id: event.parent ? event.parent.id : null,
      kind: 'http_client_request',
      route: event.route,
      parameter_names: event.message ? event.message.map((m) => m.name) : null,
      status_code: event.httpClientResponse
        ? event.httpClientResponse.status_code
        : null,
    };
  }

  httpServerRequest(event) {
    return {
      id: event.id,
      parent_id: event.parent ? event.parent.id : null,
      kind: 'http_server_request',
      parameter_names: event.message ? event.message.map((m) => m.name) : null,
      route: event.route,
      status_code: event.httpServerResponse
        ? event.httpServerResponse.status ||
          event.httpServerResponse.status_code
        : null,
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
