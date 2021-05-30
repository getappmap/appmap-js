/* eslint-disable max-classes-per-file */
// @ts-check

const { analyzeQuery } = require('../database');

/**
 * @typedef {import('./types').CodeObject} CodeObject
 * @typedef {(codeObject: CodeObject) => boolean} MatchFn
 * @typedef {import('./types').SQLInfo | string} SQLInfo
 */

/**
 *
 * @param {string} name
 * @returns {MatchFn}
 */
function matchPackage(name) {
  const fn = (/** @type {CodeObject} */ codeObject) =>
    codeObject.name === name && codeObject.type === 'package';
  fn.toJSON = () => `package ${name}`;
  return fn;
}
/**
 *
 * @param {string} name
 * @returns {MatchFn}
 */
function matchClass(name) {
  const fn = (/** @type {CodeObject} */ codeObject) =>
    codeObject.name === name && codeObject.type === 'class';
  fn.toJSON = () => `class ${name}`;
  return fn;
}
/**
 *
 * @param {string} name
 * @param {boolean} isStatic
 * @returns {MatchFn}
 */
function matchFunction(name, isStatic) {
  const fn = (/** @type import('./types').CodeObject */ codeObject) =>
    codeObject.name === name &&
    codeObject.type === 'function' &&
    codeObject.static === isStatic;
  fn.toJSON = () => `${isStatic ? 'static ' : ''}function ${name}`;
  return fn;
}

/**
 * @returns {MatchFn}
 */
function matchDatabase() {
  const fn = (/** @type import('./types').CodeObject */ codeObject) =>
    codeObject.type === 'database';
  fn.toJSON = () => `Database`;
  return fn;
}

/**
 * @param {string} tableName
 * @returns {MatchFn}
 */
function matchTable(tableName) {
  const fn = (/** @type import('./types').CodeObject */ codeObject) => {
    if (codeObject.type !== 'query') {
      return false;
    }

    const queryInfo = /** @type {SQLInfo} */ analyzeQuery(codeObject.name);
    if (typeof queryInfo !== 'object') {
      return false;
    }

    return queryInfo.tables.includes(tableName);
  };
  fn.toJSON = () => `Table ${tableName}`;
  return fn;
}

/**
 * @returns {MatchFn}
 */
function matchHTTP() {
  const fn = (/** @type import('./types').CodeObject */ codeObject) =>
    codeObject.type === 'http';
  fn.toJSON = () => `HTTP`;
  return fn;
}

/**
 * @param {string} routeName
 * @returns {MatchFn}
 */
function matchRoute(routeName) {
  const fn = (/** @type import('./types').CodeObject */ codeObject) => {
    if (codeObject.type !== 'route') {
      return false;
    }

    return codeObject.name === routeName;
  };
  fn.toJSON = () => `Route ${routeName}`;
  return fn;
}

class FunctionMatchSpec {
  /**
   *
   * @param {string[]} packageNames
   * @param {string[]} classNames
   * @param {boolean} isStatic
   * @param {string} functionName
   */
  constructor(packageNames, classNames, isStatic, functionName) {
    const packageTokens = packageNames.map(matchPackage);
    const classTokens = classNames.map(matchClass);
    const functionToken = matchFunction(functionName, isStatic);
    this.tokens = packageTokens.concat(classTokens).concat([functionToken]);
  }
}

class TableMatchSpec {
  /**
   * @param {string} tableName
   */
  constructor(tableName) {
    this.tokens = [matchDatabase(), matchTable(tableName)];
  }
}

class RouteMatchSpec {
  /**
   * @param {string} routeName
   */
  constructor(routeName) {
    this.tokens = [matchHTTP(), matchRoute(routeName)];
  }
}

module.exports = { FunctionMatchSpec, TableMatchSpec, RouteMatchSpec };
