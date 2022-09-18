import sha256 from 'crypto-js/sha256';
import analyze from './sql/analyze';

export const hasProp = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);

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

  return getSqlLabelFromString(event.sql_query.normalized_sql || event.sql_query.sql || '');
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

export function getRepositoryUrl(url, path, commit = 'master', lineNumber = null) {
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
    } else if (charCase === LOWER && firstCase === UPPER && secondCase === UPPER) {
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
    const queryOps = analyze(sqlQuery);
    const content = ['sql', queryOps.action, ...queryOps.tables].filter(Boolean).join('');
    return sha256(content).toString();
  }

  return e.toString();
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

export function transformToJSON(dataKeys, obj) {
  const emptyLength = (value) => 'length' in value && value.length === 0;
  const emptySize = (value) => 'size' in value && value.size === 0;
  const empty = (value) =>
    value === undefined ||
    value === null ||
    (typeof value === 'object' && [emptyLength, emptySize].find((fn) => fn(value)));

  return dataKeys.reduce((memo, key) => {
    const value = obj[key];
    if (empty(value)) {
      // nop
    } else if (value.constructor === Set) {
      memo[key] = [...value];
    } else {
      memo[key] = value;
    }
    return memo;
  }, {});
}
