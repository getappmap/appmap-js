import sha256 from 'crypto-js/sha256';
import { normalizeSQL } from '../fingerprint/algorithms';

export * from '../util';

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

  if (e.sql) {
    return 'sql';
  }

  return e.definedClass;
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

// Insert `event` to `arr` with a position determined from `base`. May modify `base` as well as
// `arr`.
export function hashedPositionalInsert(arr, base, event) {
  let index = -1;
  for (let i = arr.length; i < base.length; i += 1) {
    if (identityHashEvent(base[i]) === identityHashEvent(event)) {
      index = i;
      break;
    }
  }

  if (index === -1) {
    const lengthDiff = base.length - arr.length;
    for (let i = 0; i < lengthDiff; i += 1) {
      arr.push(null);
    }

    base.push(null);
    arr.push(event);
    return;
  }

  const lengthDiff = index - arr.length;
  for (let i = 0; i < lengthDiff; i += 1) {
    arr.push(null);
  }

  if (lengthDiff < 0) {
    base.push(null);
  }

  arr.push(event);
}

// Does nothing. Might do something later. Most likely, this gets removed before the branch is
// merged. If you're reading this in the future, whoops!
//
// The idea here is each event finds it's desired 'ordinal' in a base array. Given the following
// array of hashes:
// base: [ 1, 2, 3, 4, 5, 6]
// work: [ 1, 9, 7, 8, 5, 6]
//
// Matching hashes want to keep the same index. This becomes their 'ordinal'.
// ordinals: [ 0, ?, ?, ?, 5, 6]
//
// When placing an ambiguous ordinal, it helps to know that a subsequent ordinal has a well-known
// index. This may indicate a change versus a removal and addition. Otherwise, if we deem an
// ambiguous ordinal a removal, subsequent ordinals must follow suit.
export function getEventOrdinals(base, events) {
  events.map((b) => base.findIndex((a) => a.hash === b.hash));
}
