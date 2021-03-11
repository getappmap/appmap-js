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

  const { sqlQuery } = e;
  if (sqlQuery) {
    const queryOps = normalizeSQL(sqlQuery);
    const content = ['sql', queryOps.action, ...queryOps.tables]
      .filter(Boolean)
      .join('');
    console.log(sqlQuery, content);
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
  let events = eventArray.filter((e) => e.isCall() && e.httpServerRequest);
  if (events.length === 0) {
    events = eventArray.filter((e) => e.isCall() && !e.parent);
  }
  return events;
}
