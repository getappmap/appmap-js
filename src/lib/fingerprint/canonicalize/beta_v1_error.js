/* eslint-disable class-methods-use-this */
import { normalizeSQL } from '../algorithms';
import Base from './base';

/**
 * At ERROR level, the order of events is not important, and the amount of data
 * retained about events is minimal.
 */
class Canonicalize extends Base {
  /**
   *
   * @param {Event} event
   */
  sql(event) {
    const normalizedSQL = normalizeSQL(event.sqlQuery);
    if (typeof normalizedSQL === 'string') {
      const sqlLower = event.sqlQuery.toLowerCase();
      if (
        sqlLower.indexOf('insert') !== -1 ||
        sqlLower.indexOf('update') !== -1
      ) {
        return {
          id: event.id,
          parent_id: event.parent?.id,
          kind: 'sql',
          sql: normalizeSQL(event.sqlQuery),
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
      if (
        ['insert', 'update', 'delete'].filter((x) => actions.includes(x))
          .length > 0
      ) {
        return normalizedSQL;
      }
    }

    return null;
  }

  httpServerRequest(event) {
    return {
      id: event.id,
      parent_id: event.parent?.id,
      kind: 'http_server_request',
      route: event.route,
      status: event.httpServerResponse?.status,
    };
  }

  functionCall(event) {
    if (event.codeObject.labels.size === 0) {
      return null;
    }

    return {
      id: event.id,
      parent_id: event.parent?.id,
      kind: 'function',
      labels: [...event.codeObject.labels],
    };
  }
}

export default function (appmap) {
  return new Canonicalize(appmap).execute();
}
