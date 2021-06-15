/* eslint-disable class-methods-use-this */
const { analyzeQuery } = require('../../database');
const Base = require('./base');

/**
 * At UPDATE level, the order of events is not important, and the amount of data
 * retained about events is minimal. Function labels are retained. HTTP server
 * and client request method, route, and status code are retained; but not parameter
 * names.
 */
class Canonicalize extends Base {
  /**
   *
   * @param {Event} event
   */
  sql(event) {
    const normalizedSQL = analyzeQuery(event.sql);
    if (typeof normalizedSQL === 'string') {
      const sqlLower = event.sqlQuery.toLowerCase();
      if (
        sqlLower.indexOf('insert') !== -1 ||
        sqlLower.indexOf('update') !== -1
      ) {
        return {
          id: event.id,
          parent_id: event.parent ? event.parent.id : null,
          kind: 'sql',
          sql: analyzeQuery(event.sql),
        };
      }
    } else if (normalizedSQL) {
      let actions = [];
      if (normalizedSQL.action) {
        actions.push(normalizedSQL.action);
      }
      if (normalizedSQL.actions) {
        actions = actions.concat(normalizedSQL.actions);
      }
      if (['insert', 'update', 'delete'].find((x) => actions.includes(x))) {
        return normalizedSQL;
      }
    }

    return null;
  }

  httpClientRequest(event) {
    return {
      id: event.id,
      parent_id: event.parent ? event.parent.id : null,
      kind: 'http_client_request',
      route: event.route,
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
      id: event.id,
      parent_id: event.parent ? event.parent.id : null,
      kind: 'function',
      labels,
    };
  }
}

module.exports = (appmap) => new Canonicalize(appmap).execute();
