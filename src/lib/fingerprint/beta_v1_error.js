import { compareEvents, notNull, uniqueEvents } from './algorithms';

/**
 * At ERROR level, the order of events is not important, and the amount of data
 * retained about events is minimal.
 */
class Canonicalize {
  constructor(appmap) {
    this.appmap = appmap;
  }

  execute() {
    return this.appmap.events
      .map(Canonicalize.transform)
      .filter(notNull)
      .sort(compareEvents)
      .map(uniqueEvents())
      .filter(notNull);
  }

  static transform(event) {
    if (event.sql) {
      return Canonicalize.sql();
    }
    if (event.httpServerRequest) {
      return Canonicalize.httpServerRequest(event);
    }

    return Canonicalize.functionCall(event);
  }

  static sql() {
    // TODO: Include the tables that are present in the query?
    return {
      kind: 'sql',
    };
  }

  static httpServerRequest(event) {
    return {
      kind: 'http_server_request',
      route: event.route,
      status: event.httpServerResponse.status,
    };
  }

  static functionCall(event) {
    if (!event.labels || event.labels.length === 0) {
      return null;
    }

    return {
      kind: 'function',
      labels: event.labels,
    };
  }
}

export default function (appmap) {
  return new Canonicalize(appmap).execute();
}
