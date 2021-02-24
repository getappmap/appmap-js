/**
 * At DEBUG level, the order of labeled function calls matters, and all function class
 * and method names are retained. SQL queries are also retained in order.
 */
class Canonicalize {
  constructor(appmap) {
    this.appmap = appmap;
  }

  execute() {
    return this.appmap.events.map(Canonicalize.transform);
  }

  static transform(event) {
    if (event.sql) {
      return Canonicalize.sql(event);
    }
    if (event.httpServerRequest) {
      return Canonicalize.httpServerRequest(event);
    }

    return Canonicalize.functionCall(event);
  }

  static sql(event) {
    return {
      kind: 'sql',
      sql: event.sqlQuery,
    };
  }

  static httpServerRequest(event) {
    return {
      kind: 'http_server_request',
      mime_type: event.httpServerResponse.mime_type,
      parameters: event.httpServerRequest.message,
      route: event.route,
      status: event.httpServerResponse.status,
    };
  }

  static functionCall(event) {
    return {
      kind: 'function',
      function: event.codeObject.id,
      labels: [...event.codeObject.labels],
    };
  }
}

export default function (appmap) {
  return new Canonicalize(appmap).execute();
}
