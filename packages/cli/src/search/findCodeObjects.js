// @ts-check

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
} = require('./matchSpec');
const CodeObjectMatcher = require('./codeObjectMatcher');
const { MATCH_ABORT, MATCH_CONTINUE, MATCH_COMPLETE } = require('./constants');

/** @typedef {import('./types').CodeObject[]} ClassMap */
/** @typedef {import('./types').CodeObject} CodeObject */
/** @typedef {import('./types').CodeObjectMatch} CodeObjectMatch */

/**
 * Normalize the classMap, so that when "package" code objects like 'app/models'
 * are represented as one entry in the classMap, they are expanded to one entry
 * for each token.
 *
 * @param {ClassMap} classMap
 */
function expandClassMap(classMap) {
  /**
   * @param {CodeObject} item
   * @returns {CodeObject}
   */
  function expandItem(item) {
    let normalizedItem;
    if (item.type === 'package' && item.name.includes('/')) {
      const names = item.name.split('/');
      let lastItem;
      {
        const lastName = names.pop();
        lastItem = /** @type CodeObject */ { ...item };
        lastItem.name = lastName;
        lastItem.children = item.children;
      }
      const packageItems = names.map((name) => {
        const packageItem = /** @type CodeObject */ { ...item };
        packageItem.children = [];
        packageItem.name = name;
        return packageItem;
      });
      packageItems.push(lastItem);
      packageItems
        .slice(0, packageItems.length - 1)
        .forEach((packageItem, index) => {
          packageItem.children = [packageItems[index + 1]];
        });
      // eslint-disable-next-line prefer-destructuring
      normalizedItem = packageItems[0];
    } else {
      normalizedItem = item;
    }

    if (normalizedItem.children) {
      normalizedItem.children = [...normalizedItem.children].map(expandItem);
    }
    return normalizedItem;
  }
  return classMap.map(expandItem);
}

/**
 * @param {string} functionId
 * @returns {import('./types').CodeObjectMatchSpec}
 */
function parsePackage(functionId) {
  const packageTokens = functionId.split('/');
  return new FunctionMatchSpec(packageTokens, []);
}

/**
 * @param {string} functionId
 * @returns {import('./types').CodeObjectMatchSpec}
 */
function parseClass(functionId) {
  const packageTokens = functionId.split('/');
  const className = packageTokens.pop();
  return new FunctionMatchSpec(packageTokens, className.split('::'));
}

/**
 * @param {string} functionId
 * @returns {import('./types').CodeObjectMatchSpec}
 */
function parseFunction(functionId) {
  const packageTokens = functionId.split('/');
  const classAndFunction = packageTokens.length > 1 ? packageTokens.pop() : '';

  if (classAndFunction.includes('.')) {
    const [className, functionName] = classAndFunction.split('.');
    return new FunctionMatchSpec(
      packageTokens,
      className.split('::'),
      true,
      functionName
    );
  } else if (classAndFunction.includes('#')) {
    const [className, functionName] = classAndFunction.split('#');
    return new FunctionMatchSpec(
      packageTokens,
      className.split('::'),
      false,
      functionName
    );
  }

  return null;
}

/**
 * @param {string} tableName
 * @returns {import('./types').CodeObjectMatchSpec}
 */
function parseTable(tableName) {
  return new TableMatchSpec(tableName);
}

/**
 * @param {string} routeName
 * @returns {import('./types').CodeObjectMatchSpec}
 */
function parseRoute(routeName) {
  return new RouteMatchSpec(routeName);
}

function parseCodeObjectId(/** @type {string} */ codeObjectId) {
  const tokens = codeObjectId.split(':');
  const type = tokens.shift();
  if (!type || tokens.length === 0) {
    return null;
  }

  const id = tokens.join(':');
  const parsers = {
    package: parsePackage,
    class: parseClass,
    function: parseFunction,
    table: parseTable,
    route: parseRoute,
  };

  const parser = parsers[type];
  if (!parser) {
    return null;
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
    this.matchSpec = parseCodeObjectId(codeObjectId);
    if (!this.matchSpec) {
      console.warn(`Unable to parse code object id ${codeObjectId}`);
    }
    if (verbose()) {
      console.warn(`Searching for: ${JSON.stringify(this.matchSpec.tokens)}`);
    }
  }

  /**
   * @returns {Promise<CodeObjectMatch[]>}
   */
  async find() {
    if (!this.matchSpec) {
      return;
    }

    // Scan classMaps to identify the AppMaps which contain the function.
    // Scan those AppMaps for the function events.
    // Retain the following context for each matching event:
    // * HTTP server request ancestor
    // * Parent calling function, class, and package
    // * Descendent SQL and HTTP client requests

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

      let match = null;
      const findMatchingFunction = (
        /** @type {import('./types').CodeObject} */ item,
        /** @type {import('./types').CodeObjectMatcher} */ matcher,
        /** @type {import('./types').CodeObject[]} */ ancestors
      ) => {
        if (match) {
          return;
        }

        const buildCodeObject = () => {
          let parent = null;
          ancestors.forEach((ancestor) => {
            parent = new CodeObjectModel(ancestor, parent);
          });
          return new CodeObjectModel(item, parent);
        };

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
            return;
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

      let classMap = JSON.parse((await fsp.readFile(fileName)).toString());
      classMap = expandClassMap(classMap);
      classMap.forEach((/** @type import('./types').CodeObject */ item) =>
        findMatchingFunction(item, new CodeObjectMatcher(this.matchSpec), [])
      );
    }

    await processFiles(
      `${this.appMapDir}/**/classMap.json`,
      checkClassMap.bind(this)
    );
    return matches;
  }
}

module.exports = FindCodeObjects;
