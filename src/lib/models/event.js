import { normalizeSQL } from '@/lib/fingerprint/algorithms';
import {
  addHiddenProperty,
  hasProp,
  arrayCompare,
  sqlCompare,
  httpCompare,
  setCompare,
  hashEvent,
} from './util';

// This class supercedes `CallTree` and `CallNode`. Events are stored in a flat
// array and can also be traversed like a tree via `parent` and `children`.
export default class Event {
  constructor(data) {
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
    addHiddenProperty(this, 'next');
    addHiddenProperty(this, 'previous');
    addHiddenProperty(this, 'hash');

    // Data must be written last, after our properties are configured.
    Object.assign(this, data);
  }

  get methodId() {
    return this.method_id;
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

  get message() {
    return this.callEvent.$hidden.message;
  }

  get httpServerRequest() {
    return this.callEvent.http_server_request;
  }

  get httpServerResponse() {
    return this.returnEvent.http_server_response;
  }

  get definedClass() {
    return this.defined_class ? this.defined_class.replace(/\./g, '/') : null;
  }

  get requestPath() {
    const { httpServerRequest } = this;
    if (!httpServerRequest) {
      return null;
    }

    return (
      httpServerRequest.normalized_path_info || httpServerRequest.path_info
    );
  }

  get requestMethod() {
    const { httpServerRequest } = this;
    if (!httpServerRequest) {
      return null;
    }

    return httpServerRequest.request_method;
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

  get callEvent() {
    return this.isCall() ? this : this.$hidden.linkedEvent;
  }

  get returnEvent() {
    return this.isReturn() ? this : this.$hidden.linkedEvent;
  }

  get hash() {
    if (!this.$hidden.hash) {
      this.$hidden.hash = hashEvent(this);
    }
    return this.$hidden.hash;
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

  dataObjects() {
    return [this.parameters, this.messages, this.returnValue]
      .flat()
      .filter(Boolean);
  }

  // Unused. Ugly. Remove me?
  compare(other) {
    if (!sqlCompare(this, other)) {
      return false;
    }

    if (!httpCompare(this, other)) {
      return false;
    }

    if (!arrayCompare(this.parameters, other.parameters)) {
      return false;
    }

    if (!setCompare(this.labels, other.labels)) {
      return false;
    }

    return (
      this.event === other.event &&
      this.definedClass === other.definedClass &&
      this.methodId === other.methodId &&
      this.isStatic === other.isStatic
    );
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

    const { definedClass, isStatic, methodId } = this;
    return `${definedClass}${isStatic ? '.' : '#'}${methodId}`;
  }
}
