// @ts-check

/* eslint-disable no-fallthrough */
/* eslint-disable consistent-return */
/* eslint-disable max-classes-per-file */
/* eslint-disable no-else-return */
const fsp = require('fs').promises;
const { dirname, basename } = require('path');
const { verbose, processFiles } = require('../utils');
const FunctionSpec = require('./functionSpec');
const FunctionMatcher = require('./functionMatcher');
const { MATCH_ABORT, MATCH_CONTINUE, MATCH_COMPLETE } = require('./constants');

/** @typedef {import('./types').CodeObject[]} ClassMap */
/** @typedef {import('./types').CodeObject} CodeObject */
/** @typedef {import('./types').CodeObjectMatch} CodeObjectMatch */

// Normalize the classMap, so that when "package" code objects like 'app/models'
// are represented as one entry in the classMap, they are expanded to one entry
// for each token.
function expandClassMap(/** @type ClassMap */ classMap) {
  function expandItem(/** @type CodeObject */ item) {
    let normalizedItem;
    if (item.name.includes('/')) {
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

function parseFunctionId(/** @type {string} */ functionId) {
  const packageTokens = functionId.split('/');
  const classAndFunction = packageTokens.pop();

  function parseClassAndFunction() {
    if (classAndFunction.includes('.')) {
      const [className, functionName] = classAndFunction.split('.');
      return new FunctionSpec(
        packageTokens,
        className.split('::'),
        true,
        functionName
      );
    } else if (classAndFunction.includes('#')) {
      const [className, functionName] = classAndFunction.split('#');
      return new FunctionSpec(
        packageTokens,
        className.split('::'),
        false,
        functionName
      );
    }

    return null;
  }

  return parseClassAndFunction();
}

/**
 * Find code objects and AppMaps in a directory that match search criteria.
 * Each search result consists of both the code object and the AppMap in which it was found.
 * These results can be further refined into specific events using FindEvents.
 */
class FindCodeObjects {
  /**
   * @param {string} appMapDir
   * @param {string} functionId
   */
  // TODO: This 'functionId' can be genericized to any type that's found in the classMap file,
  // which includes 'query' and 'route' as well as 'package', 'class' and 'function'.
  constructor(appMapDir, functionId) {
    this.appMapDir = appMapDir;
    this.functionSpec = parseFunctionId(functionId);
    if (!this.functionSpec) {
      console.warn(`Unable to parse function id ${functionId}`);
    }
    if (verbose()) {
      console.warn(this.functionSpec);
    }
  }

  /**
   * @returns {Promise<CodeObjectMatch[]>}
   */
  async find() {
    if (!this.functionSpec) {
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
        /** @type {import('./types').CodeObjectMatcher} */ matcher
      ) => {
        if (match) {
          return;
        }

        const matchResult = matcher.match(item);
        switch (matchResult) {
          case MATCH_ABORT:
            return;
          case MATCH_COMPLETE:
            match = { appmap: appmapName, codeObject: item };
            matches.push(match);
            return;
          case MATCH_CONTINUE:
          default:
        }
        if (item.children) {
          item.children.forEach((child) =>
            findMatchingFunction(child, matcher)
          );
        }
        matcher.pop();
      };

      let classMap = JSON.parse((await fsp.readFile(fileName)).toString());
      classMap = expandClassMap(classMap);
      classMap.forEach((/** @type import('./types').CodeObject */ item) =>
        findMatchingFunction(item, new FunctionMatcher(this.functionSpec))
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
