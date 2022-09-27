import { addHiddenProperty, hasProp, transformToJSON } from './util';
import analyzeSQL, { abstractSqlAstJSON } from './sql/analyze';
import normalizeSQL from './sql/normalize';
import HashBuilder from './hashBuilder';

// This class supercedes `CallTree` and `CallNode`. Events are stored in a flat
// array and can also be traversed like a tree via `parent` and `children`.
export default class Event {
  static contentType(...messages) {
    const msg = messages.find((message) => (message?.headers || {})['Content-Type']);
    if (!msg) {
      return null;
    }

    return msg.headers['Content-Type'];
  }

  constructor(obj) {
    let data = obj;

    if (obj instanceof Event) {
      data = { ...obj };

      if (obj.$hidden.parameters) {
        data.parameters = obj.$hidden.parameters.map((p) => ({ ...p }));
      }

      if (Array.isArray(obj.$hidden.message)) {
        data.message = obj.$hidden.message.map((m) => ({ ...m }));
      }

      if (obj.$hidden.labels) {
        data.labels = [...obj.$hidden.labels];
      }

      if (obj.$hidden.exceptions) {
        data.exceptions = [...obj.$hidden.exceptions];
      }
    }

    this.dataKeys = Object.keys(data);

    // Cyclic references shall not be enumerable
    if (data.event === 'call') {
      addHiddenProperty(this, 'parent');
      addHiddenProperty(this, 'children', { writable: false, value: [] });
      addHiddenProperty(this, 'dataReferences', { writable: false, value: [] });
      addHiddenProperty(this, 'codeObject');
      addHiddenProperty(this, 'parameters');
      addHiddenProperty(this, 'message');
    }

    addHiddenProperty(this, 'linkedEvent');
    addHiddenProperty(this, 'labels');
    addHiddenProperty(this, 'exceptions');
    addHiddenProperty(this, 'next');
    addHiddenProperty(this, 'previous');
    addHiddenProperty(this, 'hash');
    addHiddenProperty(this, 'identityHash');
    addHiddenProperty(this, 'depth');

    // Data must be written last, after our properties are configured.
    Object.assign(this, data);
  }

  get depth() {
    if (this.$hidden.depth === undefined) {
      let result = 0;
      let { parent } = this;
      while (parent) {
        result += 1;
        parent = parent.parent;
      }
      this.$hidden.depth = result;
    }
    return this.$hidden.depth;
  }

  get methodId() {
    return this.method_id;
  }

  get isFunction() {
    return this.definedClass && this.methodId;
  }

  get isStatic() {
    return this.static;
  }

  get sql() {
    return this.callEvent.sql_query;
  }

  get returnValue() {
    return this.returnEvent.return_value;
  }

  get elapsedTime() {
    return this.returnEvent.elapsed;
  }

  get elapsedInstrumentationTime() {
    return this.returnEvent.elapsed_instrumentation;
  }

  get linkedEvent() {
    return this.$hidden.linkedEvent;
  }

  get next() {
    return this.$hidden.next;
  }

  get previous() {
    return this.$hidden.previous;
  }

  get parent() {
    return this.$hidden.parent;
  }

  get children() {
    return this.$hidden.children || [];
  }

  get codeObject() {
    return this.callEvent.$hidden.codeObject;
  }

  get parameters() {
    return this.callEvent.$hidden.parameters;
  }

  get labels() {
    const eventLabels = this.callEvent.$hidden.labels || [];
    return new Set([...eventLabels, ...this.callEvent.codeObject.labels]);
  }

  get exceptions() {
    return this.returnEvent.$hidden.exceptions || [];
  }

  get message() {
    return this.callEvent.$hidden.message;
  }

  get httpServerRequest() {
    return this.callEvent.http_server_request;
  }

  get httpServerResponse() {
    return this.returnEvent.http_server_response;
  }

  get httpClientRequest() {
    return this.callEvent.http_client_request;
  }

  get httpClientResponse() {
    return this.returnEvent.http_client_response;
  }

  get definedClass() {
    return this.defined_class ? this.defined_class.replace(/\./g, '/') : null;
  }

  get requestPath() {
    if (this.httpServerRequest) {
      return this.httpServerRequest.normalized_path_info || this.httpServerRequest.path_info;
    }
    if (this.httpClientRequest) {
      return this.httpClientRequest.url;
    }
    return null;
  }

  get requestMethod() {
    if (this.httpServerRequest) {
      return this.httpServerRequest.request_method;
    }
    if (this.httpClientRequest) {
      return this.httpClientRequest.request_method;
    }
    return null;
  }

  get requestContentType() {
    return Event.contentType(this.httpServerRequest, this.httpClientRequest);
  }

  get responseContentType() {
    return Event.contentType(this.httpServerResponse, this.httpClientResponse);
  }

  get route() {
    const { requestMethod, requestPath } = this;
    if (!requestMethod || !requestPath) {
      return null;
    }

    return `${requestMethod} ${requestPath}`;
  }

  get sqlQuery() {
    const { sql } = this;
    if (!sql) {
      return null;
    }
    return sql.normalized_sql || sql.sql;
  }

  get fqid() {
    return `event:${this.id}`;
  }

  get previousSibling() {
    const { parent } = this;
    if (!parent) {
      return null;
    }

    const myIndex = parent.children.findIndex((e) => e === this);
    console.assert(myIndex !== -1, 'attempted to locate index of an orphaned event');

    if (myIndex === 0) {
      return null;
    }

    return parent.children[myIndex - 1];
  }

  get nextSibling() {
    const { parent } = this;

    if (!parent) {
      let event = this.next;

      // Get the next root level event
      while (event) {
        if (event.isCall() && !event.parent) {
          return event;
        }

        event = event.next;
      }

      return null;
    }

    const myIndex = this.parent.children.findIndex((e) => e === this);
    console.assert(myIndex !== -1, 'attempted to locate index of an orphaned event');

    if (myIndex === parent.children.length - 1) {
      return null;
    }

    return parent.children[myIndex + 1];
  }

  set codeObject(value) {
    if (hasProp(this.$hidden, 'codeObject')) {
      this.$hidden.codeObject = value;
    }
  }

  set parameters(value) {
    if (hasProp(this.$hidden, 'parameters')) {
      this.$hidden.parameters = value;
    }
  }

  set labels(value) {
    if (hasProp(this.$hidden, 'labels')) {
      this.$hidden.labels = value;
    }
  }

  set exceptions(value) {
    if (hasProp(this.$hidden, 'exceptions')) {
      this.$hidden.exceptions = value;
    }
  }

  set message(value) {
    if (hasProp(this.$hidden, 'message')) {
      this.$hidden.message = value;
    }
  }

  set linkedEvent(value) {
    this.$hidden.linkedEvent = value;
  }

  set next(value) {
    this.$hidden.next = value;
  }

  set previous(value) {
    this.$hidden.previous = value;
  }

  set parent(value) {
    this.$hidden.parent = value;
  }

  link(event) {
    /* eslint-disable no-param-reassign */
    if (event.linkedEvent || this.linkedEvent) {
      return;
    }

    event.linkedEvent = this;
    this.linkedEvent = event;
    /* eslint-enable no-param-reassign */
  }

  isCall() {
    return this.event === 'call';
  }

  isReturn() {
    return this.event === 'return';
  }

  get threadId() {
    return this.thread_id;
  }

  get parentId() {
    return this.returnEvent.parent_id;
  }

  get callEvent() {
    return this.isCall() ? this : this.$hidden.linkedEvent;
  }

  get returnEvent() {
    return this.isReturn() ? this : this.$hidden.linkedEvent;
  }

  get identityHash() {
    if (!this.$hidden.identityHash) {
      this.$hidden.identityHash = this.buildIdentityHash(this).digest();
    }
    return this.$hidden.identityHash;
  }

  get hash() {
    if (!this.$hidden.hash) {
      this.$hidden.hash = this.buildStableHash(this).digest();
    }
    return this.$hidden.hash;
  }

  get stableProperties() {
    if (!this.$hidden.stableProperties) {
      this.$hidden.stableProperties = this.gatherStableProperties();
    }
    return this.$hidden.stableProperties;
  }

  callStack() {
    const stack = this.ancestors().reverse();
    stack.push(this.callEvent);
    return stack;
  }

  ancestors() {
    const ancestorArray = [];
    let event = this.callEvent.parent;

    while (event) {
      ancestorArray.push(event);
      event = event.parent;
    }

    return ancestorArray;
  }

  descendants() {
    const descendantArray = [];
    const queue = [...this.children];

    while (queue.length) {
      const event = queue.pop();
      event.children.forEach((child) => queue.push(child));
      descendantArray.push(event);
    }

    return descendantArray;
  }

  traverse(fn) {
    let event = this;
    const boundaryEvent = this.nextSibling;
    let { onEnter } = fn;
    let { onExit } = fn;

    if (typeof fn === 'function') {
      onEnter = fn;
      onExit = fn;
    }

    while (event) {
      if (event.isCall() && onEnter) {
        onEnter(event);
      } else if (event.isReturn() && onExit) {
        onExit(event);
      }

      event = event.next;
      if (!event || event === boundaryEvent) {
        break;
      }
    }
  }

  dataObjects() {
    return [this.parameters, this.message, this.returnValue].flat().filter(Boolean);
  }

  get qualifiedMethodId() {
    const { definedClass, isStatic, methodId } = this;
    if (!definedClass) return undefined;
    return `${definedClass}${isStatic ? '.' : '#'}${methodId}`;
  }

  toJSON() {
    return transformToJSON(this.dataKeys, this);
  }

  toString() {
    const { sqlQuery } = this;
    if (sqlQuery) {
      return sqlQuery;
    }

    const { route } = this;
    if (route) {
      return route;
    }

    return this.qualifiedMethodId;
  }

  // Returns canonical properties tied to the event's core identity: SQL, HTTP, or a
  // specific method on a specific class. Identity properties are used to identify events that are
  // added/removed between two AppMaps, as opposed to changes. If two events share the same
  // identity properties, they won't be reported as an add/remove, but may be reported as a change.
  gatherIdentityProperties() {
    if (this.httpServerRequest) {
      return { event_type: 'http_server_request', route: this.route };
    }
    if (this.httpClientRequest) {
      return { event_type: 'http_client_request', route: this.route };
    }

    const { sqlQuery } = this;
    if (sqlQuery) {
      const queryOps = analyzeSQL(sqlQuery);
      if (!queryOps)
        return {
          event_type: 'sql',
          sql_normalized: normalizeSQL(sqlQuery, this.sql.database_type),
        }; // Best we can do

      return {
        event_type: 'sql',
        actions: [...new Set(queryOps.actions)].sort(),
        tables: [...new Set(queryOps.tables)].sort(),
      };
    }

    return {
      event_type: 'function',
      id: this.codeObject.id,
    };
  }

  // Collects properties of an event which are not dependent on the specifics
  // of invocation.
  gatherStableProperties() {
    const { sqlQuery } = this;

    // Convert null and undefined values to empty strings
    const normalizeProperties = (/** @type{Record<string,string>} */ properties) =>
      Object.fromEntries(
        Object.entries(properties).map(([key, value]) => [
          key,
          value === undefined || value === null ? '' : value,
        ])
      );

    // Augment a set of base properties with HTTP client/server request properties.
    const requestProperties = (/** @type{Record<string,string>} */ baseProperties) =>
      Object.assign(baseProperties, {
        route: this.route,
        status_code:
          this.httpServerResponse?.status ||
          this.httpServerResponse?.status_code ||
          this.httpClientResponse?.status ||
          this.httpServerResponse?.status_code,
      });

    let properties;
    if (sqlQuery) {
      const sqlNormalized = abstractSqlAstJSON(sqlQuery, this.sql.database_type)
        // Collapse repeated variable literals and parameter tokens (e.g. '?, ?' in an IN clause)
        .split(/{"type":"variable"}(?:,{"type":"variable"})*/g)
        .join(`{"type":"variable"}`);
      properties = {
        event_type: 'sql',
        sql_normalized: sqlNormalized,
      };
    } else if (this.httpServerRequest) {
      properties = requestProperties({ event_type: 'http_server_request' });
    } else if (this.httpClientRequest) {
      properties = requestProperties({
        event_type: 'http_client_request',
      });
    } else {
      properties = {
        event_type: 'function',
        id: this.codeObject.id,
        raises_exception: this.returnEvent.exceptions && this.returnEvent.exceptions.length > 0,
      };
    }
    return normalizeProperties(properties);
  }

  buildIdentityHash() {
    return HashBuilder.buildHash('event-identity-v2', this.gatherIdentityProperties());
  }

  buildStableHash() {
    return HashBuilder.buildHash('event-stable-properties-v2', this.gatherStableProperties());
  }
}
