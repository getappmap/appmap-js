/* eslint-disable class-methods-use-this */
const { obfuscate, analyzeQuery } = require('../../database');
const Base = require('./base');

/**
 * At TRACE level, the order of labeled function calls matters, and all function class
 * and method names are retained. SQL queries are also retained in order. HTTP
 * server and client request parameters are retained.
 */
class Canonicalize extends Base {
  sql(event) {
    const analyzedQuery = analyzeQuery(event.sql);
    const result = {
      kind: 'sql',
      sql: {
        normalized_query: obfuscate(event.sqlQuery, event.sql.database_type),
      },
    };
    if (typeof analyzedQuery === 'object') {
      result.analyzed_query = analyzedQuery;
    }
    return result;
  }

  httpClientRequest(event) {
    return {
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
      kind: 'http_server_request',
      route: event.route,
      parameter_names: event.message ? event.message.map((m) => m.name) : null,
      status_code: event.httpServerResponse
        ? event.httpServerResponse.status ||
          event.httpServerResponse.status_code
        : null,
    };
  }

  functionCall(event) {
    return {
      kind: 'function',
      function: event.codeObject.id,
      labels: [...event.codeObject.labels],
    };
  }
}

module.exports = (appmap) => new Canonicalize(appmap).execute();
