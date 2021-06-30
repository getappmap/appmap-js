/* eslint-disable class-methods-use-this */
const { analyzeQuery, obfuscate } = require('../../database');
const EventTree = require('./eventTree');

/**
 * At UPDATE level, the order of events is not important, and the amount of data
 * retained about events is minimal. Function labels are retained. HTTP server
 * and client request method, route, and status code are retained; but not parameter
 * names.
 */
class Canonicalize extends EventTree {
  /**
   *
   * @param {Event} event
   */
  sql(event) {
    const analyzedQuery = analyzeQuery(event.sql);
    if (typeof analyzedQuery === 'string') {
      const sqlLower = event.sqlQuery.toLowerCase();
      if (
        sqlLower.indexOf('insert') !== -1 ||
        sqlLower.indexOf('update') !== -1
      ) {
        return {
          kind: 'sql',
          sql: {
            normalized_query: obfuscate(
              event.sqlQuery,
              event.sql.database_type
            ),
          },
        };
      }
    } else if (analyzedQuery && analyzedQuery.actions) {
      if (
        ['insert', 'update', 'delete'].find((x) =>
          analyzedQuery.actions.includes(x)
        )
      ) {
        return {
          kind: 'sql',
          sql: {
            analyzed_query: analyzedQuery,
          },
        };
      }
    }

    return null;
  }

  httpClientRequest(event) {
    return {
      kind: 'http_client_request',
      route: event.route,
      status_code: event.httpClientResponse
        ? event.httpClientResponse.status_code
        : null,
    };
  }

  httpServerRequest(event) {
    return {
      kind: 'http_server_request',
      route: event.route,
      status_code: event.httpServerResponse
        ? event.httpServerResponse.status_code
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
