/* eslint-disable class-methods-use-this */
import { normalizeSQL } from '../algorithms';
import Base from './base';

/**
 * At DEBUG level, the order of labeled function calls matters, and all function class
 * and method names are retained. SQL queries are also retained in order.
 */
class Canonicalize extends Base {
  sql(event) {
    return {
      id: event.id,
      parent_id: event.parent?.id,
      kind: 'sql',
      sql: normalizeSQL(event.sqlQuery),
    };
  }

  httpServerRequest(event) {
    return {
      id: event.id,
      parent_id: event.parent?.id,
      kind: 'http_server_request',
      mime_type: event.httpServerResponse?.mime_type,
      parameters: event.httpServerRequest?.message,
      route: event.route,
      status: event.httpServerResponse?.status,
    };
  }

  functionCall(event) {
    return {
      id: event.id,
      parent_id: event.parent?.id,
      kind: 'function',
      function: event.codeObject.id,
      labels: [...event.codeObject.labels],
    };
  }
}

export default function (appmap) {
  return new Canonicalize(appmap).execute();
}
