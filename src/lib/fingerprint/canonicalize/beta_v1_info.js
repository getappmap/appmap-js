import { buildTree, compareEvents, notNull, uniqueEvents } from '../algorithms';

/**
 * At INFO level, the order of labeled function calls matters. SQL query strings
 * are collected, sorted and made unique.
 */
class Canonicalize {
  constructor(appmap) {
    this.appmap = appmap;
  }

  execute() {
    const queries = this.appmap.events
      .filter((event) => event.isCall())
      .filter((event) => event.sql)
      .map(Canonicalize.sql)
      .sort(compareEvents)
      .map(uniqueEvents())
      .filter(notNull);

    const events = this.appmap.events
      .filter((event) => event.isCall())
      .filter((event) => !event.sql)
      .map(Canonicalize.transform)
      .filter(notNull);

    const tree = buildTree(events);

    return {
      sql: queries,
      events: tree,
    };
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
      id: event.id,
      parent_id: event.parent?.id,
      kind: 'http_server_request',
      route: event.route,
      status: event.httpServerResponse?.status,
    };
  }

  static functionCall(event) {
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
