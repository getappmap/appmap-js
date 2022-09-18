const { formatValue, formatHttpServerRequest } = require('../utils');

/** @typedef {import('./types').Event} Event */
/** @typedef {function(string,Event[],string):boolean} Matcher */

/** @type {Matcher} */
const returnValue = (expectedValue, stack) => {
  const event = stack[stack.length - 1];
  return formatValue(event.returnValue) === expectedValue;
};

/** @type {Matcher} */
const httpServerRequest = (expectedValue, stack) =>
  !!stack
    .filter((e) => e.httpServerRequest)
    .find((e) => formatHttpServerRequest(e) === expectedValue);

/** @type {Matcher} */
const ancestor = (expectedValue, stack) => !!stack.find((e) => e.codeObject.id === expectedValue);

/** @type {Matcher} */
const caller = (expectedValue, stack) => {
  if (stack.length === 1) {
    return false;
  }
  const callerEvent = stack[stack.length - 2];
  return callerEvent.codeObject.id === expectedValue;
};

/** @type {Matcher} */
function defaultMatcher(expectedValue, stack, fieldName) {
  const value = stack[stack.length - 1][fieldName];
  return expectedValue === value;
}

const MATCHERS = {
  returnValue,
  httpServerRequest,
  ancestor,
  caller,
};

/**
 *
 * @param {string} fieldName
 * @param {string[] | string} expectedValue
 * @param {Event[]} stack
 * @returns {boolean}
 */
function matchFilter(fieldName, expectedValue, stack) {
  const matcher = MATCHERS[fieldName] || defaultMatcher;
  /** @type {string[]} */
  let expectedValues;
  if (Array.isArray(expectedValue)) {
    expectedValues = expectedValue;
  } else {
    expectedValues = [expectedValue.toString()];
  }
  return !!expectedValues.find((v) => matcher(v, stack, fieldName));
}

module.exports = matchFilter;
