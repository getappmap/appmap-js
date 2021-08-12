/* eslint-disable max-classes-per-file */
const { analyzeQuery, obfuscate } = require('../database');

/**
 * @typedef {import('./types').CodeObject} CodeObject
 * @typedef {(codeObject: CodeObject) => boolean} MatchFn
 * @typedef {import('./types').SQLInfo | string} SQLInfo
 */

/**
 * @param {string} expectedType
 * @returns {MatchFn}
 */
function matchType(expectedType) {
  const fn = (/** @type {CodeObject} */ codeObject) =>
    codeObject.type === expectedType;
  fn.toJSON = () => expectedType;
  return fn;
}

/**
 * @param {string} expectedType
 * @param {string} expectedName
 * @returns {MatchFn}
 */
function matchTypeAndName(expectedType, expectedName) {
  const fn = (/** @type {CodeObject} */ codeObject) =>
    codeObject.name === expectedName && codeObject.type === expectedType;
  fn.toJSON = () => [expectedType, expectedName].join(' ');
  return fn;
}

/**
 *
 * @param {string} name
 * @returns {MatchFn}
 */
function matchPackage(name) {
  return matchTypeAndName('package', name);
}
/**
 *
 * @param {string} name
 * @returns {MatchFn}
 */
function matchClass(name) {
  return matchTypeAndName('class', name);
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
  return matchType('database');
}

/**
 * @returns {MatchFn}
 */
function matchQuery(expectedQuery) {
  const fn = (/** @type import('./types').CodeObject */ codeObject) => {
    if (codeObject.type !== 'query') {
      return false;
    }

    // TODO: Brute force is probably not a good idea.
    // Need to store the database type on the codeObject.
    return (
      obfuscate(codeObject.name, 'mysql') === expectedQuery ||
      obfuscate(codeObject.name, 'postgres') === expectedQuery ||
      obfuscate(codeObject.name, 'sqlite') === expectedQuery
    );
  };
  fn.toJSON = () => `query ${expectedQuery}`;
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

    const queryInfo = /** @type {SQLInfo} */ analyzeQuery({
      sql: codeObject.name,
      database_type: codeObject.database_type,
    });
    if (typeof queryInfo !== 'object') {
      return false;
    }

    return queryInfo.tables.includes(tableName);
  };
  fn.toJSON = () => `table ${tableName}`;
  return fn;
}

/**
 * @returns {MatchFn}
 */
function matchHTTP() {
  return matchType('http');
}

/**
 * @param {string} routeName
 * @returns {MatchFn}
 */
function matchRoute(routeName) {
  return matchTypeAndName('route', routeName);
}

class FunctionMatchSpec {
  /**
   *
   * @param {string[]} packageNames
   * @param {string[]} classNames
   * @param {boolean} isStatic
   * @param {string} functionName
   */
  constructor(packageNames, classNames, isStatic = null, functionName = null) {
    const packageTokens = packageNames.map(matchPackage);
    const classTokens = classNames.map(matchClass);
    let functionTokens = [];
    if (functionName) {
      functionTokens = [matchFunction(functionName, isStatic)];
    }
    this.tokens = packageTokens.concat(classTokens).concat(functionTokens);
  }
}

class HTTPMatchSpec {
  constructor() {
    this.tokens = [matchHTTP()];
  }
}

class DatabaseMatchSpec {
  constructor() {
    this.tokens = [matchDatabase()];
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

class QueryMatchSpec {
  /**
   * @param {string} query
   */
  constructor(query) {
    this.tokens = [matchDatabase(), matchQuery(query)];
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

module.exports = {
  DatabaseMatchSpec,
  FunctionMatchSpec,
  HTTPMatchSpec,
  TableMatchSpec,
  QueryMatchSpec,
  RouteMatchSpec,
};
