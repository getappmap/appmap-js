// @ts-check
const fsp = require('fs').promises;

const { buildAppMap } = require('./utils');
const { formatValue, formatHttpServerRequest } = require('../utils');

/** @typedef {import('./types').Event} Event */
/** @typedef {import('./types').CodeObject} CodeObject */
/** @typedef {import('./types').EventMatch} EventMatch */

/**
 * Find events in a specific AppMap that match a code object.
 */
class FindEvents {
  /**
   *
   * @param {string} appMapName
   * @param {CodeObject} codeObject
   */
  constructor(appMapName, codeObject) {
    this.appMapName = appMapName;
    this.codeObject = codeObject;
  }

  /**
   * Sets a return value filter.
   *
   * @param {string} val
   * @see formatValue
   */
  set returnValue(val) {
    this._returnValue = val;
  }

  /**
   * Sets an HTTP server request filter.
   *
   * @param {string} val
   * @see formatHttpServerRequest
   */
  set httpServerRequest(val) {
    this._httpServerRequest = val;
  }

  /**
   * @returns {Promise<EventMatch[]>}
   */
  async matches() {
    // Scan through the AppMap events for matches to the codeObject. Build a result
    // which include the matching events, plus context:
    // * HTTP server request ancestor
    // * Labeled ancestors
    // * Caller
    // * Callees
    // * Labeled descendants
    // * I/O (non-function) descendants

    const appmapFile = [this.appMapName, 'appmap.json'].join('.');
    const appmapData = JSON.parse((await fsp.readFile(appmapFile)).toString());
    const appmap = buildAppMap(appmapData).build();
    const stack = [];
    const matches = /** @type {EventMatch[]} */ [];
    const matchesByEvent = {};

    const significant = (/** @type {Event} */ event) =>
      event.labels.length > 0 || !event.isFunction;

    const beginMatch = (/** @type {Event} */ event) => {
      const ancestors = stack
        .filter(significant)
        .map((e) => ({ call: e, return: e.linkedEvent }));
      const caller =
        /** @type {Event} */ stack.length >= 1 ? stack[stack.length - 1] : null;
      const matchObj = /** @type {EventMatch} */ {
        appmap: this.appMapName,
        event: { call: event, return: event.returnEvent },
        ancestors,
        descendants: [],
      };
      if (caller) {
        matchObj.caller = { call: caller, return: caller.returnEvent };
      }
      matches.push(matchObj);
      matchesByEvent[event] = matchObj;
      return matchObj;
    };

    const endMatch = (/** @type {Event} */ event) => {
      delete matchesByEvent[event.callEvent];
    };

    const functionDataEqual = (/** @type {Event} */ event) => {
      if (!event.codeObject) {
        return false;
      }

      return (
        this.codeObject.name === event.codeObject.name &&
        event.codeObject.type === 'function' &&
        this.codeObject.static === event.codeObject.static &&
        this.codeObject.location === event.codeObject.location
      );
    };

    const returnValueMatch = (/** @type {Event} */ event) => {
      if (!this._returnValue) {
        return true;
      }

      return formatValue(event.returnValue) === this._returnValue;
    };

    const httpServerRequestMatch = () => {
      if (!this._httpServerRequest) {
        return true;
      }

      return stack
        .filter((e) => e.http_server_request)
        .find((e) => formatHttpServerRequest(e) === this._httpServerRequest);
    };

    const filterMatch = (/** @type {Event} */ event) =>
      returnValueMatch(event) && httpServerRequestMatch();

    const functionMatch = (/** @type {Event} */ event) =>
      functionDataEqual(event) && filterMatch(event);

    const enter = (/** @type {Event} */ event) => {
      if (functionMatch(event)) {
        beginMatch(event);
      }
      stack.push(event);
      if (significant(event)) {
        Object.values(matchesByEvent).forEach((match) => {
          match.descendants.push({ call: event, return: event.returnEvent });
        });
      }
    };
    const leave = (/** @type {Event} */ event) => {
      if (matchesByEvent[event.callEvent]) {
        endMatch(event);
      }
      stack.pop();
    };

    appmap.events.forEach((/** @type {Event} */ event) => {
      if (event.isCall()) {
        enter(event);
      } else {
        leave(event);
      }
    });

    return matches;
  }
}

module.exports = FindEvents;
