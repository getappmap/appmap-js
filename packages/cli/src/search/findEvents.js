// @ts-check
const fsp = require('fs').promises;

const { buildAppMap } = require('./utils');
const matchFilter = require('./matchFilter');
const buildTrigrams = require('./trigram');

/** @typedef {import('./types').Filter} Filter */
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
    this.filters = /** @type {{string: string | string[]}} */ {};
  }

  /**
   * Sets filters which are applied to all events.
   *
   * @param {Filter[]} filters
   */
  filter(filters) {
    this.filters = filters;
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
    const stack = /** @type {Event[]} */ [];
    const matches = /** @type {EventMatch[]} */ [];
    const matchesByEvent = {};

    const significant = (/** @type {Event} */ event) =>
      event.labels.size > 0 || !event.isFunction;

    const beginMatch = () => {
      const event = stack[stack.length - 1];
      const ancestors = stack.slice(0, stack.length - 1).filter(significant);
      const caller =
        /** @type {Event} */ stack.length >= 2 ? stack[stack.length - 2] : null;
      const matchObj = /** @type {EventMatch} */ {
        appmap: this.appMapName,
        event,
        ancestors,
        packageTrigrams: [],
        classTrigrams: [],
        functionTrigrams: [],
        descendants: [],
      };
      if (caller) {
        matchObj.caller = caller;
      }

      if (event.children.length === 0 && caller) {
        const trigrams = buildTrigrams(caller, event, null);

        matchObj.functionTrigrams.push(trigrams.functionTrigram);
        matchObj.classTrigrams.push(trigrams.classTrigram);
        matchObj.packageTrigrams.push(trigrams.packageTrigram);
      }

      matches.push(matchObj);
      matchesByEvent[event] = matchObj;
      return matchObj;
    };

    const endMatch = (/** @type {Event} */ event) => {
      delete matchesByEvent[event.callEvent];
    };

    const filterMatch = () => {
      if (this.filters.length === 0) {
        return true;
      }
      const filters = this.filters.reduce(
        (
          /** @type {{string:string[]}} */ memo,
          /** @type {Filter} */ filter
        ) => {
          let existing = memo[filter.name];
          if (!existing) {
            // eslint-disable-next-line no-multi-assign
            existing = memo[filter.name] = [];
          }
          existing.push(filter.value);
          return memo;
        },
        {}
      );
      return (
        Object.keys(filters).filter((filterName) => {
          const filterValues = filters[filterName];
          return matchFilter(filterName, filterValues, stack);
        }).length === Object.keys(filters).length
      );
    };

    const codeObjectMatch = () => {
      const event = stack[stack.length - 1];
      const matchCodeObject = (/** @type {CodeObject} */ eventCodeObject) => {
        if (this.codeObject.id === eventCodeObject.id) {
          return true;
        }
        if (!eventCodeObject.parent) {
          return false;
        }
        return matchCodeObject(eventCodeObject.parent);
      };

      return matchCodeObject(event.codeObject) && filterMatch();
    };

    const enter = (/** @type {Event} */ event) => {
      if (
        matches[matches.length - 1] &&
        matches[matches.length - 1].event === stack[stack.length - 1]
      ) {
        const match = matches[matches.length - 1];
        const caller = stack.length >= 2 ? stack[stack.length - 2] : null;
        const matchEvent = stack[stack.length - 1];
        const callee = event;
        const trigrams = buildTrigrams(caller, matchEvent, callee);

        match.functionTrigrams.push(trigrams.functionTrigram);
        match.classTrigrams.push(trigrams.classTrigram);
        match.packageTrigrams.push(trigrams.packageTrigram);
      }

      if (significant(event)) {
        Object.values(matchesByEvent).forEach((match) => {
          match.descendants.push(event);
        });
      }

      stack.push(event);
      if (codeObjectMatch()) {
        beginMatch();
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
