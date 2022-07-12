/* eslint-disable no-fallthrough */
/* eslint-disable consistent-return */
/* eslint-disable max-classes-per-file */
/* eslint-disable no-else-return */

import { codeObjectId } from '@appland/models';
import { readFile } from 'fs/promises';
import { basename, dirname } from 'path';
import { inspect } from 'util';
import { processFiles, verbose } from '../utils';
import DescentCodeObjectMatcher from './descentCodeObjectMatcher';
import IterateCodeObjectMatcher from './iterateCodeObjectMatcher';
import {
  DatabaseMatchSpec,
  FunctionMatchSpec,
  HTTPMatchSpec,
  QueryMatchSpec,
  RegExpRegExp,
  RouteMatchSpec,
  TableMatchSpec,
} from './matchSpec';
import {
  CodeObject,
  CodeObjectMatch,
  CodeObjectMatcher,
  CodeObjectMatchSpec,
} from './types';

function parsePackage(functionId: string): CodeObjectMatchSpec[] {
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

function parseClass(functionId: string): CodeObjectMatchSpec[] {
  const packageTokens = functionId.split('/');
  if (packageTokens.length === 1) {
    return [];
  }

  const className = packageTokens.pop()!;
  const classNames = className.split('::');
  return [
    new FunctionMatchSpec([packageTokens.join('/')], classNames),
    new FunctionMatchSpec(packageTokens, classNames),
  ];
}

function parseFunction(functionId: string): CodeObjectMatchSpec[] {
  const packageTokens = functionId.split('/');
  if (packageTokens.length === 1) {
    return [];
  }

  const classAndFunction = packageTokens.length > 1 ? packageTokens.pop()! : '';

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

function parseTable(tableName: string): CodeObjectMatchSpec[] {
  return [new TableMatchSpec(tableName)];
}

function parseRoute(routeName: string): CodeObjectMatchSpec[] {
  return [new RouteMatchSpec(routeName)];
}

function parseHTTP(): CodeObjectMatchSpec[] {
  return [new HTTPMatchSpec()];
}

function parseDatabase(): CodeObjectMatchSpec[] {
  return [new DatabaseMatchSpec()];
}

function parseQuery(query: string): CodeObjectMatchSpec[] {
  return [new QueryMatchSpec(query)];
}

function buildCodeObjectMatcher(codeObjectId: string): CodeObjectMatcher[] {
  const tokens = codeObjectId.split(':');
  const type = tokens.shift();
  if (!type || tokens.length === 0) {
    return [];
  }

  const id = tokens.join(':');
  const isRegExpMatch = id.match(RegExpRegExp);
  if (isRegExpMatch) {
    const body = isRegExpMatch[1];
    const flags = isRegExpMatch[2];
    const pattern = new RegExp(body, flags);

    return [new IterateCodeObjectMatcher(type, pattern)];
  } else {
    const parsers: Record<string, (...args: any[]) => CodeObjectMatchSpec[]> = {
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

    return parser(id).map((spec) => new DescentCodeObjectMatcher(spec));
  }
}

/**
 * Find code objects and AppMaps in a directory that match search criteria.
 * Each search result consists of both the code object and the AppMap in which it was found.
 * These results can be further refined into specific events using FindEvents.
 */
export default class FindCodeObjects {
  matchers: CodeObjectMatcher[];

  constructor(
    public codeObjectPattern: string,
    public appmapDir?: string,
    public appmapFiles?: string[]
  ) {
    this.matchers = buildCodeObjectMatcher(codeObjectPattern);
    if (verbose()) {
      console.warn(`Searching for: ${inspect(this.matchers)}`);
    }
  }

  async find(
    // eslint-disable-next-line no-unused-vars
    fileCountFn = (_count: number) => {},
    progressFn = () => {}
  ): Promise<CodeObjectMatch[]> {
    // Scan classMaps to identify the AppMaps which contain the code object.
    // Scan those AppMaps for the code object events.
    // Retain the following context for each matching event:
    // * HTTP server request ancestor
    // * Parent calling function, class, and package
    // * Descendent SQL and HTTP client requests

    const matches: CodeObjectMatch[] = [];

    /**
     * Search a class map file for matching code objects.
     * Results are collected in +matches+.
     *
     * @param {string} fileName
     * @returns void
     */
    const checkClassMap = async (fileName: string): Promise<void> => {
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

      const buildCodeObject = (
        codeObject: CodeObject,
        parent?: CodeObject
      ): void => {
        codeObject.parent = parent;
        const id = codeObjectId(codeObject).join('');
        codeObject.fqid = [codeObject.type, id].join(':');
        if (codeObject.children) {
          codeObject.children.forEach((child) =>
            buildCodeObject(child, codeObject)
          );
        }
      };

      const classMap = JSON.parse(
        await readFile(fileName, 'utf-8')
      ) as CodeObject[];
      classMap.forEach((co) => buildCodeObject(co));

      this.matchers.forEach((matcher) => {
        let codeObjects: CodeObject[];
        try {
          codeObjects = matcher.matchClassMap(classMap);
        } catch (e) {
          console.warn(e);
          return;
        }
        for (const co of codeObjects) {
          const match = {
            appmap: appmapName,
            codeObject: co,
          };
          if (verbose()) {
            console.warn(`Completed match: ${co.fqid}`);
          }
          matches.push(match);
        }
      });

      progressFn();
    };

    await processFiles(
      this.appmapDir ? `${this.appmapDir}/**/classMap.json` : undefined,
      this.appmapFiles,
      checkClassMap.bind(this),
      fileCountFn
    );
    return matches;
  }
}
