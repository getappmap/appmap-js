/* eslint-disable class-methods-use-this */
const { analyzeQuery } = require('../../database');
const EventTree = require('./eventTree');

/**
 * At INFO level, the order of labeled function calls matters. SQL query strings
 * are collected, sorted and made unique.
 */
class Canonicalize extends EventTree {
  sql(event) {
    return {
      kind: 'sql',
      sql: {
        analyzed_query: analyzeQuery(event.sql),
      },
    };
  }

  httpClientRequest(event) {
    return {
      kind: 'http_client_request',
      route: event.route,
      parameter_names: event.message
        ? event.message.map((m) => m.name).sort()
        : null,
      status_code: event.httpClientResponse
        ? event.httpClientResponse.status_code
        : null,
    };
  }

  httpServerRequest(event) {
    return {
      kind: 'http_server_request',
      route: event.route,
      parameter_names: event.message
        ? event.message.map((m) => m.name).sort()
        : null,
      status_code: event.httpServerResponse
        ? event.httpServerResponse.status ||
          event.httpServerResponse.status_code
        : null,
    };
  }

  functionCall(event) {
    const labels = this.whitelistedLabels(event.codeObject.labels);
    if (labels.length === 0) {
      return null;
    }

    return {
      kind: 'function',
      labels,
    };
  }
}

module.exports = (appmap) => new Canonicalize(appmap).execute();
