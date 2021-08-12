/* eslint-disable no-fallthrough */
/* eslint-disable consistent-return */
/* eslint-disable max-classes-per-file */
/* eslint-disable no-else-return */
const fsp = require('fs').promises;
const { dirname, basename } = require('path');
// @ts-ignore
const { CodeObject: CodeObjectModel } = require('@appland/models');
const { verbose, processFiles } = require('../utils');
const {
  FunctionMatchSpec,
  TableMatchSpec,
  RouteMatchSpec,
  HTTPMatchSpec,
  DatabaseMatchSpec,
  QueryMatchSpec,
} = require('./matchSpec');
const CodeObjectMatcher = require('./codeObjectMatcher');
const { MATCH_ABORT, MATCH_CONTINUE, MATCH_COMPLETE } = require('./constants');

/** @typedef {import('./types').CodeObject[]} ClassMap */
/** @typedef {import('./types').CodeObject} CodeObject */
/** @typedef {import('./types').CodeObjectMatch} CodeObjectMatch */
/** @typedef {import('./types').CodeObjectMatchSpec} CodeObjectMatchSpec */

/**
 * @param {string} functionId
 * @returns {CodeObjectMatchSpec[]}
 */
function parsePackage(functionId) {
  const packageTokens = functionId.split('/');
  return [
    // In the classMap, packages are sometimes split by '/' and appear nested.
    // Sometimes, the package name includes the '/' character, e.g. app/models,
    // as a single code object in the class map. So when searching for packages,
    // match either style. From a code standpoint, I've found this much simpler than
    // trying to handle different cases in the match spec.
    new FunctionMatchSpec([functionId], []),
    new FunctionMatchSpec(packageTokens, []),
  ];
}

/**
 * @param {string} functionId
 * @returns {CodeObjectMatchSpec[]}
 */
function parseClass(functionId) {
  const packageTokens = functionId.split('/');
  if (packageTokens.length === 1) {
    return [];
  }

  const className = packageTokens.pop();
  const classNames = className.split('::');
  return [
    new FunctionMatchSpec([packageTokens.join('/')], classNames),
    new FunctionMatchSpec(packageTokens, classNames),
  ];
}

/**
 * @param {string} functionId
 * @returns {CodeObjectMatchSpec[]}
 */
function parseFunction(functionId) {
  const packageTokens = functionId.split('/');
  if (packageTokens.length === 1) {
    return [];
  }

  const classAndFunction = packageTokens.length > 1 ? packageTokens.pop() : '';

  if (classAndFunction.includes('.')) {
    const [className, functionName] = classAndFunction.split('.');
    return [
      new FunctionMatchSpec(
        [packageTokens.join('/')],
        className.split('::'),
        true,
        functionName
      ),
      new FunctionMatchSpec(
        packageTokens,
        className.split('::'),
        true,
        functionName
      ),
    ];
  } else if (classAndFunction.includes('#')) {
    const [className, functionName] = classAndFunction.split('#');
    return [
      new FunctionMatchSpec(
        [packageTokens.join('/')],
        className.split('::'),
        false,
        functionName
      ),
      new FunctionMatchSpec(
        packageTokens,
        className.split('::'),
        false,
        functionName
      ),
    ];
  }

  return [];
}

/**
 * @param {string} tableName
 * @returns {CodeObjectMatchSpec[]}
 */
function parseTable(tableName) {
  return [new TableMatchSpec(tableName)];
}

/**
 * @param {string} routeName
 * @returns {CodeObjectMatchSpec[]}
 */
function parseRoute(routeName) {
  return [new RouteMatchSpec(routeName)];
}

function parseHTTP() {
  return [new HTTPMatchSpec()];
}

function parseDatabase() {
  return [new DatabaseMatchSpec()];
}

function parseQuery(query) {
  return [new QueryMatchSpec(query)];
}

/**
 * @param {string} codeObjectId
 * @returns {CodeObjectMatchSpec[]}
 */
function parseCodeObjectId(codeObjectId) {
  const tokens = codeObjectId.split(':');
  const type = tokens.shift();
  if (!type || tokens.length === 0) {
    return [];
  }

  const id = tokens.join(':');
  const parsers = {
    package: parsePackage,
    class: parseClass,
    function: parseFunction,
    http: parseHTTP,
    route: parseRoute,
    database: parseDatabase,
    query: parseQuery,
    table: parseTable,
  };

  const parser = parsers[type];
  if (!parser) {
    return [];
  }

  return parser(id);
}

/**
 * Find code objects and AppMaps in a directory that match search criteria.
 * Each search result consists of both the code object and the AppMap in which it was found.
 * These results can be further refined into specific events using FindEvents.
 */
class FindCodeObjects {
  /**
   * @param {string} appMapDir
   * @param {string} codeObjectId
   */
  constructor(appMapDir, codeObjectId) {
    this.appMapDir = appMapDir;
    this.matchSpecs = parseCodeObjectId(codeObjectId);
    if (this.matchSpecs.length === 0) {
      console.warn(`Unable to parse code object id ${codeObjectId}`);
    }
    if (verbose()) {
      this.matchSpecs.forEach((spec) => {
        console.warn(`Searching for: ${JSON.stringify(spec.tokens)}`);
      });
    }
  }

  /**
   * @returns {Promise<CodeObjectMatch[]>}
   */
  async find(
    // eslint-disable-next-line no-unused-vars
    fileCountFn = (/** @type {Number} */ _count) => {},
    progressFn = () => {}
  ) {
    if (this.matchSpecs.length === 0) {
      return;
    }

    // Scan classMaps to identify the AppMaps which contain the function.
    // Scan those AppMaps for the function events.
    // Retain the following context for each matching event:
    // * HTTP server request ancestor
    // * Parent calling function, class, and package
    // * Descendent SQL and HTTP client requests

    /** @type {CodeObjectMatch[]} */
    const matches = [];

    /**
     * Search a class map file for matching code objects.
     * Results are collected in +matches+.
     *
     * @param {string} fileName
     * @returns void
     */
    async function checkClassMap(fileName) {
      const indexDir = dirname(fileName);
      if (basename(indexDir) === 'Inventory') {
        return;
      }

      let appmapName = indexDir;
      if (indexDir.indexOf(process.cwd()) === 0) {
        appmapName = indexDir.substring(process.cwd().length + 1);
      }

      if (verbose()) {
        console.warn(`Checking AppMap ${appmapName}`);
      }

      const findMatchingFunction = (
        /** @type {import('./types').CodeObject} */ item,
        /** @type {import('./types').CodeObjectMatcher} */ matcher,
        /** @type {import('./types').CodeObject[]} */ ancestors
      ) => {
        const buildCodeObject = () => {
          let parent = null;
          ancestors.forEach((ancestor) => {
            parent = new CodeObjectModel(ancestor, parent);
          });
          return new CodeObjectModel(item, parent);
        };

        let match;
        const matchResult = matcher.match(item);
        switch (matchResult) {
          case MATCH_ABORT:
            return;
          case MATCH_COMPLETE:
            match = { appmap: appmapName, codeObject: buildCodeObject() };
            if (verbose()) {
              console.warn(`Completed match: ${JSON.stringify(match)}`);
            }
            matches.push(match);
          case MATCH_CONTINUE:
          default:
        }
        if (item.children) {
          ancestors.push(item);
          item.children.forEach((child) =>
            findMatchingFunction(child, matcher, ancestors)
          );
          ancestors.pop();
        }
        matcher.pop();
      };

      const classMap = JSON.parse((await fsp.readFile(fileName)).toString());
      this.matchSpecs.forEach((/** @type {CodeObjectMatchSpec} */ spec) => {
        classMap.forEach((/** @type import('./types').CodeObject */ item) =>
          findMatchingFunction(item, new CodeObjectMatcher(spec), [])
        );
      });
      progressFn();
    }

    await processFiles(
      `${this.appMapDir}/**/classMap.json`,
      checkClassMap.bind(this),
      fileCountFn
    );
    return matches;
  }
}

module.exports = FindCodeObjects;
