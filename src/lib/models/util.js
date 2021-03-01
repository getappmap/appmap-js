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
