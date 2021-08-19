const { obfuscate } = require('../database');

/** @typedef {import('./types').CodeObject} CodeObject */
/** @typedef {import('./types').Event} Event */

const normalizeId = (
  /** @type {CodeObject} */ co,
  /** @type {Event} */ evt
) => {
  if (co && co.type === 'query') {
    return obfuscate(evt.sqlQuery, evt.sql.database_type);
  }

  return co.id;
};

class Trigram {
  /**
   *
   * @param {Event} caller
   * @param {Event} event
   * @param {Event} callee
   * @param {function (Event): CodeObject} codeObjectFn
   */
  constructor(caller, event, callee, codeObjectFn) {
    this.codeObjectFn = codeObjectFn;
    this.caller = caller;
    this.event = event;
    this.callee = callee;
  }

  /**
   * @return {string}
   */
  get id() {
    return [this.callerId, this.codeObjectId, this.calleeId].join(' -> ');
  }

  /**
   * @return {string}
   */
  get callerId() {
    const co = this.codeObjectFn(this.caller);
    return co ? co.id : null;
  }

  /**
   * @return {string}
   */
  get codeObjectId() {
    const co = this.codeObjectFn(this.event);
    if (co) {
      return normalizeId(co, this.event);
    }
    return null;
  }

  /**
   * @return {string}
   */
  get calleeId() {
    const co = this.codeObjectFn(this.callee);
    if (co) {
      return normalizeId(co, this.callee);
    }
    return null;
  }
}

/**
 *
 * @param {Event} callerEvent
 * @param {Event} event
 * @param {Event} calleeEvent
 * @returns {{functionTrigram: import('./types').Trigram, classTrigram: import('./types').Trigram, packageTrigram: import('./types').Trigram}}
 */
function buildTrigrams(callerEvent, event, calleeEvent) {
  /** @type {function(Event) : CodeObject } */
  const codeObjectFn = (evt) => (evt ? evt.codeObject : null);
  /** @type {function(Event) : CodeObject } */
  const classFn = (evt) => (evt ? evt.codeObject.parent : null);
  /** @type {function(Event) : CodeObject } */
  const packageFn = (evt) => {
    if (!evt) {
      return null;
    }

    const findPackage = (/** @type {CodeObject} */ codeObject) => {
      if (codeObject.type === 'package' || !codeObject.parent) {
        return codeObject;
      }

      return findPackage(codeObject.parent);
    };
    return findPackage(evt.codeObject);
  };

  return {
    functionTrigram: new Trigram(callerEvent, event, calleeEvent, codeObjectFn),
    classTrigram: new Trigram(callerEvent, event, calleeEvent, classFn),
    packageTrigram: new Trigram(callerEvent, event, calleeEvent, packageFn),
  };
}

module.exports = buildTrigrams;
