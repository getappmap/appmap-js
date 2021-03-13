/* eslint-disable class-methods-use-this */
import { normalizeSQL } from '../algorithms';
import Base from './base';

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
      sql: normalizeSQL(event.sqlQuery),
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

export default function (appmap) {
  return new Canonicalize(appmap).execute();
}
