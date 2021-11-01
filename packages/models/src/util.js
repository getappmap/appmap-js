import sha256 from 'crypto-js/sha256';
import sqliteParser from 'sqlite-parser';

export const hasProp = (obj, prop) =>
  Object.prototype.hasOwnProperty.call(obj, prop);

export function isFalsey(valueObj) {
  if (!valueObj) {
    return true;
  }
  if (valueObj.class === 'FalseClass') {
    return true;
  }
  if (valueObj.class === 'Array' && valueObj.value === '[]') {
    return true;
  }
  if (valueObj.value === '') {
    return true;
  }

  return false;
}

export function isCommand(event) {
  if (event.http_server_request) {
    return true;
  }
  if (event.codeObject.labels.has('command')) {
    return true;
  }
  return false;
}

export function capitalizeString(str) {
  if (typeof str !== 'string') {
    return '';
  }

  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
}

export function getHttpLabel(event) {
  if (hasProp(event, 'http_server_request') === false) {
    return null;
  }

  const requestMethod = event.http_server_request.request_method;
  const pathInfo = event.http_server_request.path_info;
  let label;

  try {
    // the url is fake, we only care about the path info anyway
    const url = new URL(pathInfo, 'http://hostname');
    label = `${requestMethod} ${url.pathname}`;
  } catch (ex) {
    label = 'HTTP Request';
  }

  return label;
}

const sqlLabels = new Set([
  'insert',
  'update',
  'select',
  'delete',
  'alter',
  'create',
  'drop',
  'rename',
  'truncate',
  'replace',
  'savepoint',
  'release',
  'rollback',
  'lock',
  'unlock',
  'set',
  'start',
  'call',
  'delete',
  'do',
  'perform',
  'handler',
  'load',
  'purge',
  'reset',
  'prepare',
  'execute',
  'deallocate',
  'xa',
]);

export function getSqlLabelFromString(sqlString) {
  const sqlChars = [...sqlString.trimLeft()];
  if (sqlChars.length > 0 && sqlChars[0] === '(') {
    // if the query is wrapped in parenthesis, drop the opening parenthesis
    // it doesn't matter if we leave a hanging closing parenthesis.
    // e.g. (SELECT 1);

    sqlChars.shift();
  }

  // drop sub-queries and parenthesized expressions
  let depth = 0;
  const topLevelSql = sqlChars
    .reduce((arr, c) => {
      if (c === '(') {
        depth += 1;
      }

      if (depth === 0) {
        arr.push(c);
      }

      if (c === ')') {
        depth -= 1;
      }

      return arr;
    }, [])
    .join('');

  let queryType = null;
  if (topLevelSql.search(/\s/) === -1) {
    // There's only a single token
    // e.g. BEGIN, COMMIT, CHECKPOINT
    queryType = topLevelSql;
  } else {
    // convert non-word sequences to spaces and split by space
    // find the first known token
    queryType = topLevelSql
      .replace(/[^\w]+/g, ' ')
      .toLowerCase()
      .split(' ')
      .find((t) => sqlLabels.has(t));
  }

  return ['SQL', capitalizeString(queryType) || null].join(' ');
}
export function getSqlLabel(event) {
  if (hasProp(event, 'sql_query') === false) {
    return null;
  }

  return getSqlLabelFromString(
    event.sql_query.normalized_sql || event.sql_query.sql || ''
  );
}

export function getLabel(event) {
  let label = getHttpLabel(event);
  if (!label) {
    label = getSqlLabel(event);
  }
  return label;
}

export function hashify(obj) {
  const clone = { ...obj };
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (Array.isArray(val)) {
      clone[key] = new Set(val);
    } else if (val instanceof Set) {
      clone[key] = val;
    } else if (val && typeof val === 'object') {
      clone[key] = hashify(val);
    } else {
      clone[key] = val;
    }
  });
  return clone;
}

const REPOSITORY_RESOLVERS = {
  github: (d) => {
    const match = d.url.match(/github.com[:|/]?(.*).git/);
    if (!match || match.length <= 1) {
      return null;
    }

    const hash = typeof d.lineNumber === 'number' ? `#L${d.lineNumber}` : '';
    return `https://github.com/${match[1]}/blob/${d.commit}/${d.path}${hash}`;
  },
};

export function getRepositoryUrl(
  url,
  path,
  commit = 'master',
  lineNumber = null
) {
  if (url && path) {
    const d = { url, path, lineNumber, commit };
    const resolvers = Object.values(REPOSITORY_RESOLVERS);
    for (let i = 0; i < resolvers.length; i += 1) {
      const repositoryUrl = resolvers[i](d);
      if (repositoryUrl) {
        return repositoryUrl;
      }
    }
  }

  return null;
}

const UPPER = 0x1;
const LOWER = 0x10;
const getCase = (char) => (/[A-Z]/.exec(char) === null ? LOWER : UPPER);
const getCasePattern = (str) => {
  if (str.length <= 2) {
    return null;
  }

  return {
    firstCase: getCase(str[0]),
    secondCase: getCase(str[1]),
  };
};

const splitCamelCase = (str) => {
  const strLen = str.length;
  if (strLen < 1) {
    return [];
  }

  const casePattern = getCasePattern(str);
  if (!casePattern) {
    return [str];
  }

  const { firstCase, secondCase } = casePattern;
  const ret = [];
  let matched = false;
  for (let i = 2; i < strLen; i += 1) {
    const charCase = getCase(str[i]);
    if (charCase === UPPER) {
      if (firstCase === LOWER || secondCase === LOWER) {
        const token = str.slice(0, i);
        ret.push(token);
        ret.push(...splitCamelCase(str.slice(i)));
        matched = true;
        break;
      }
    } else if (
      charCase === LOWER &&
      firstCase === UPPER &&
      secondCase === UPPER
    ) {
      const token = str.slice(0, i - 1);
      ret.push(token);
      ret.push(...splitCamelCase(str.slice(i - 1)));
      matched = true;
      break;
    }
  }

  if (!matched) {
    ret.push(str);
  }

  return ret;
};

// Builds the fully qualified function name of a function (static or instance) within a
// fully qualified class name.
export function fullyQualifiedFunctionName(event) {
  const label = getLabel(event);
  if (label) {
    return label;
  }

  return event.toString();
}

// tokenizeIdentifier returns tokens of an identifier split by non-alphanumeric and camel casing
// example:
//  someMethodName   -> [ 'some', 'method', 'name' ]
//  some_method_name -> [ 'some', 'method', 'name' ]
//  org.company.MyPackage.MyClass -> [ 'org', 'company', 'My', 'Package', 'My', 'Class']
export function tokenizeIdentifier(id) {
  const ret = [];

  // Split first by non-alphanumeric tokens
  const tokens = (id || '').split(/[$.:#\-_]/);

  // Split remaining tokens by camel case
  tokens.forEach((token) => {
    ret.push(...splitCamelCase(token));
  });

  return ret;
}

export function addHiddenProperty(obj, property, opts) {
  if (!Object.hasOwnProperty.call(obj, '$hidden')) {
    Object.defineProperty(obj, '$hidden', {
      enumerable: false,
      writable: false,
      value: {},
    });
  }

  Object.defineProperty(obj.$hidden, property, {
    enumerable: false,
    writable: true,
    ...opts,
  });
}

export function buildLabels(classMap, events) {
  const result = {};

  function addLabel(label, obj, type, target) {
    /* eslint-disable no-param-reassign */
    if (!obj[label]) {
      obj[label] = {};
    }

    if (!obj[label][type]) {
      obj[label][type] = [];
    }

    obj[label][type].push(target);
    /* eslint-enable no-param-reassign */
  }

  classMap.codeObjects
    .filter((obj) => obj.labels.size)
    .forEach((codeObject) => {
      Array.from(codeObject.labels).forEach((label) => {
        addLabel(label, result, codeObject.type, codeObject);
      });
    });

  events
    .filter((event) => event.isCall() && event.labels.size)
    .forEach((event) => {
      Array.from(event.labels).forEach((label) => {
        addLabel(label, result, 'event', event);
      });
    });

  return result;
}

// sizeof returns a naive byte count for an object when serialized.
// I was using an external library for this (object-sizeof), but getting results off by a factor of
// ~2. This is awfully wasteful, slow and inaccurate but it works for now. -DB
export const sizeof = (obj) => JSON.stringify(obj).length;

const DYNAMIC_FIELDS = new Set([
  'id',
  'value',
  'thread_id',
  'elapsed',
  'object_id',
  'lineno',
  'path',
]);

function getStaticPropValues(obj) {
  return Object.getOwnPropertyNames(obj)
    .filter((k) => typeof obj[k] !== 'object' && !DYNAMIC_FIELDS.has(k))
    .sort()
    .map((k) => obj[k]);
}

/* eslint-disable no-inner-declarations */
export function parseNormalizeSQL(sql) {
  const parseSQL = sql.replace(/\s+returning\s+\*/i, '');
  let ast;
  try {
    ast = sqliteParser(parseSQL);
  } catch (e) {
    console.warn(`Unable to parse ${parseSQL} : ${e.message}`);
    return null;
  }

  try {
    const actions = [];
    const columns = [];
    const tables = [];
    let joins = 0;

    function parse(statement) {
      const tokens = ['type', 'variant']
        .map((propertyName) => statement[propertyName])
        .filter((value) => value);

      const key = tokens.join('.');
      // eslint-disable-next-line no-use-before-define
      let parser = parsers[key];
      if (!parser) {
        // eslint-disable-next-line no-use-before-define
        parser = parseStatement;
      }

      const parserList = Array.isArray(parser) ? parser : [parser];
      parserList.forEach((prs) => prs(statement));
    }

    function parseStatement(statement) {
      const reservedWords = ['type', 'variant', 'name', 'value'];
      Object.keys(statement)
        .filter((property) => !reservedWords.includes(property))
        .map((propertyName) => statement[propertyName])
        .forEach((property) => {
          if (Array.isArray(property)) {
            property.forEach(parse);
          } else if (typeof property === 'object') {
            parse(property);
          } else if (
            typeof property === 'string' ||
            typeof property === 'boolean'
          ) {
            // pass
          } else {
            console.warn(
              `Unrecognized subexpression: ${typeof property} ${property}`
            );
          }
        });
    }

    function parseList(listElements, statement) {
      listElements.forEach((listElement) => {
        const subExpression = statement[listElement];
        if (Array.isArray(subExpression)) {
          subExpression.forEach(parse);
        } else if (typeof subExpression === 'object') {
          parse(subExpression);
        } else {
          console.warn(`Unrecognized subexpression: ${subExpression}`);
        }
      });
    }
    const nop = () => {};
    function parseIdentifierExpression(statement) {
      if (statement.format === 'table') {
        tables.push(statement.name);
      }
      parseList(['columns'], statement);
    }
    function recordAction(action) {
      return () => {
        actions.push(action);
      };
    }

    const parsers = {
      'literal.text': nop,
      'literal.decimal': nop,
      'identifier.star': (statement) => columns.push(statement.name),
      'identifier.column': (statement) => columns.push(statement.name),
      'identifier.table': (statement) => tables.push(statement.name),
      'identifier.expression': parseIdentifierExpression,
      'statement.select': [recordAction('select'), parseStatement],
      'statement.insert': [recordAction('insert'), parseStatement],
      'statement.update': [recordAction('update'), parseStatement],
      'statement.delete': [recordAction('delete'), parseStatement],
      'statement.pragma': nop,
      'map.join': [
        (statement) => {
          joins += statement.map.length;
        },
        parseStatement,
      ],
    };

    parse(ast);

    function unique(list) {
      return [...new Set(list)];
    }
    const uniqueActions = unique(actions).sort();

    return {
      actions: uniqueActions,
      tables: unique(tables).sort(),
      columns: unique(columns).sort(),
      joinCount: joins,
    };
  } catch (e) {
    console.warn(`Unable to interpret AST tree for ${parseSQL} : ${e.message}`);
    return null;
  }
}
/* eslint-enable no-inner-declarations */

function dumbNormalizeSQL(sql) {
  const sqlLower = sql.toLowerCase().trim();
  if (sqlLower.indexOf('pragma') === 0) {
    return {
      tables: [],
      columns: [],
    };
  }

  const stopWords = ['where', 'limit', 'order by', 'group by', 'values', 'set'];
  const stopWordLocations = stopWords
    .map((word) => sqlLower.indexOf(` ${word}`))
    .filter((index) => index !== -1)
    .sort();
  if (stopWordLocations.length > 0) {
    const subSQL = sql.slice(0, stopWordLocations[0] - 1);
    return subSQL.replace(
      /\s([\w_]+)\(\s+'?[w\d]+'?\)\s+\)(?:\s|^)/g,
      '$1(...)'
    );
  }

  console.warn(`Unparseable: ${sql}`);
  return 'Unparseable';
}

/**
 * It's essential to normalize SQL to remove trivial differences like WHERE clauses on
 * generated id values, timestamps, etc.
 *
 * @param {string} sql
 */
export function normalizeSQL(sql) {
  return parseNormalizeSQL(sql) || dumbNormalizeSQL(sql);
}

// #region ========= BEGIN UNUSED CODE =========
// These are called from Event.compare, but that method may be removed.
// Don't merge me!

export function appMapObjectCompare(a, b) {
  if (a === b) {
    return true;
  }

  if (!a || !b) {
    return false;
  }

  const props = [
    ...new Set([
      ...Object.getOwnPropertyNames(a),
      ...Object.getOwnPropertyNames(b),
    ]),
  ].filter((k) => !DYNAMIC_FIELDS.has(k));

  // return the props that differ
  return props.filter((k) => a[k] !== b[k]);
}

export function sqlCompare(a, b) {
  let { sqlQuery: sqlQueryA } = a;
  let { sqlQuery: sqlQueryB } = b;

  if (sqlQueryA === sqlQueryB) {
    return true;
  }

  if (!sqlQueryA || !sqlQueryB) {
    return false;
  }

  sqlQueryA = normalizeSQL(sqlQueryA);
  sqlQueryB = normalizeSQL(sqlQueryB);

  if (sqlQueryA.action !== sqlQueryB.action) {
    return false;
  }

  const allColumns = [...sqlQueryA.columns, ...sqlQueryB.columns];
  const allTables = [...sqlQueryA.tables, ...sqlQueryB.tables];

  return (
    allColumns.find(
      (c) => !sqlQueryA.columns.includes(c) || !sqlQueryB.columns.includes(c)
    ) === undefined &&
    allTables.find(
      (c) => !sqlQueryA.tables.includes(c) || !sqlQueryB.tables.includes(c)
    ) === undefined
  );
}

export function arrayCompare(a, b) {
  if (a === b) {
    return true;
  }

  if (!a || !b) {
    return false;
  }

  const lengthA = a ? a.length || 0 : 0;
  const lengthB = b ? b.length || 0 : 0;

  if (lengthA !== lengthB) {
    return false;
  }

  for (let i = 0; i < lengthA; i += 1) {
    if (!appMapObjectCompare(a[i], b[i])) {
      return false;
    }
  }

  return true;
}

export function httpCompare(a, b) {
  const {
    message: messageA,
    httpServerRequest: httpServerRequestA,
    httpServerResponse: httpServerResponseA,
  } = a;

  const {
    message: messageB,
    httpServerRequest: httpServerRequestB,
    httpServerResponse: httpServerResponseB,
  } = b;

  return (
    arrayCompare(messageA, messageB) &&
    appMapObjectCompare(httpServerRequestA, httpServerRequestB) &&
    appMapObjectCompare(httpServerResponseA, httpServerResponseB)
  );
}

export function setCompare(a, b) {
  if (a === b) {
    return true;
  }

  if (!a || !b) {
    return false;
  }

  const allItems = [...new Set([...a, ...b])];
  return allItems.find((i) => !a.has(i) || !b.has(i)) === undefined;
}
// #endregion ========= END UNUSED CODE =========

export function hashHttp(e) {
  const { httpServerRequest } = e;
  if (!httpServerRequest) {
    return null;
  }

  const { message, httpServerResponse } = e;
  const content = [];
  message.forEach((m) =>
    getStaticPropValues(m).forEach((v) => content.push(v))
  );
  getStaticPropValues(httpServerResponse).forEach((v) => content.push(v));
  getStaticPropValues(httpServerRequest).forEach((v) => content.push(v));

  return sha256(content.join('')).toString();
}

export function hashSql(e) {
  const { sqlQuery } = e;
  if (!sqlQuery) {
    return null;
  }

  const normalizedSql = normalizeSQL(sqlQuery);
  const content = [normalizedSql.action];

  if (normalizedSql.columns) {
    normalizedSql.columns.forEach((c) => content.push(c));
  }

  if (normalizedSql.tables) {
    normalizedSql.tables.forEach((t) => content.push(t));
  }

  return sha256(content.join('')).toString();
}

// Returns a unique 'hash' (or really, a key) tied to the event's core identity: SQL, HTTP, or a
// specific method on a specific class. This is _really_ naive. The idea is that this better finds
// a singular change versus an existing object that has been removed and a new object added in its
// place.
export function identityHashEvent(e) {
  if (e.httpServerRequest) {
    return 'http';
  }

  const { sqlQuery } = e;
  if (sqlQuery) {
    const queryOps = normalizeSQL(sqlQuery);
    const content = ['sql', queryOps.action, ...queryOps.tables]
      .filter(Boolean)
      .join('');
    return sha256(content).toString();
  }

  return e.toString();
}

export function hashEvent(e) {
  let hash = hashHttp(e);
  if (hash) {
    return hash;
  }

  hash = hashSql(e);
  if (hash) {
    return hash;
  }

  const content = [];
  getStaticPropValues(e).forEach((v) => content.push(v));
  e.parameters.forEach((p) =>
    getStaticPropValues(p).forEach((v) => content.push(v))
  );
  [...e.labels].forEach((l) => content.push(l));

  return sha256(content.join('')).toString();
}

export function resolveDifferences(arr1, arr2) {
  let arr1Index = 0;
  let arr2Index = 0;

  for (;;) {
    const a = arr1[arr1Index];
    const b = arr2[arr2Index];
    if (!a && !b) {
      return;
    }

    if (typeof a === 'undefined') {
      arr1.push(null);
      arr1Index += 1;
      arr2Index += 1;
      continue; // eslint-disable-line no-continue
    }

    if (typeof b === 'undefined') {
      arr2.push(null);
      arr1Index += 1;
      arr2Index += 1;
      continue; // eslint-disable-line no-continue
    }

    const hashA = a.identityHash;
    const hashB = b.identityHash;
    if (hashA !== hashB) {
      let instancesA = 0;
      for (let i = arr1Index + 1; i < arr1.length; i += 1) {
        instancesA += arr1[i].identityHash === hashA ? 1 : 0;
      }

      let instancesB = 0;
      for (let i = arr2Index + 1; i < arr2.length; i += 1) {
        instancesB += arr2[i].identityHash === hashA ? 1 : 0;
      }

      if (instancesA >= instancesB) {
        arr2.splice(arr2Index, 0, null);
      } else if (instancesA < instancesB) {
        arr1.splice(arr1Index, 0, null);
      } // eslint-disable-line no-continue
    }

    arr1Index += 1;
    arr2Index += 1;
  }
}

export function getRootEvents(eventArray) {
  return eventArray.filter((e) => e.isCall() && !e.parent);
}
