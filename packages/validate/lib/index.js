const Ajv = require('ajv');
const { asTree } = require('treeify');
const { structureAJVErrorArray, summarizeAJVErrorTree } = require('ajv-error-tree');
const { AppmapError, InputError, assert } = require('./assert.js');
const { schema: schema_1_2_0 } = require('../schema/1-2-0.js');
const { schema: schema_1_3_0 } = require('../schema/1-3-0.js');
const { schema: schema_1_4_0 } = require('../schema/1-4-0.js');
const { schema: schema_1_5_0 } = require('../schema/1-5-0.js');
const { schema: schema_1_5_1 } = require('../schema/1-5-1.js');
const { schema: schema_1_6_0 } = require('../schema/1-6-0.js');
const { schema: schema_1_7_0 } = require('../schema/1-7-0.js');
const { schema: schema_1_8_0 } = require('../schema/1-8-0.js');

const ajv = new Ajv({
  // jsPropertySyntax: true
  verbose: true,
});

const versions = new Map([
  ['1.2.0', ajv.compile(schema_1_2_0)],
  ['1.3.0', ajv.compile(schema_1_3_0)],
  ['1.4.0', ajv.compile(schema_1_4_0)],
  ['1.5.0', ajv.compile(schema_1_5_0)],
  ['1.5.1', ajv.compile(schema_1_5_1)],
  ['1.6.0', ajv.compile(schema_1_6_0)],
  ['1.7.0', ajv.compile(schema_1_7_0)],
  ['1.8.0', ajv.compile(schema_1_8_0)],
]);

const keys = Array.from(versions.keys());

/* c8 ignore start */
const hasOwnProperty =
  Reflect.getOwnPropertyDescriptor(Object, 'hasOwn') !== undefined
    ? Object.hasOwn
    : (object, key) => Reflect.getOwnPropertyDescriptor(object, key) !== undefined;
/* c8 ignore stop */

const getCallTag = (event) => {
  assert(event.event === 'call', Error, 'expected a call event');
  if (hasOwnProperty(event, 'method_id')) {
    return 'function';
  } else if (hasOwnProperty(event, 'http_client_request')) {
    return 'http-client';
  } else if (hasOwnProperty(event, 'http_server_request')) {
    return 'http-server';
  } else if (hasOwnProperty(event, 'sql_query')) {
    return 'sql';
  } /* c8 ignore start */ else {
    throw new Error('invalid event should not have satisfied the schema');
  } /* c8 ignore stop */
};

const getReturnTag = (event) => {
  assert(event.event === 'return', Error, 'expected a return event');
  if (hasOwnProperty(event, 'return_value') || hasOwnProperty(event, 'exceptions')) {
    return 'function';
  } else if (hasOwnProperty(event, 'http_client_response')) {
    return 'http-client';
  } else if (hasOwnProperty(event, 'http_server_response')) {
    return 'http-server';
  } else {
    return 'sql|function';
  }
};

const stringifyTree = (tree, options) => {
  if (options['schema-depth'] === 0 && options['instance-depth'] === 0) {
    return typeof tree === 'string' ? tree : asTree(tree, true);
  } else {
    return JSON.stringify(tree, null, 2);
  }
};

const checkSchema = (data, options) => {
  const validate = versions.get(options.version);
  if (!validate(data)) {
    const tree1 = structureAJVErrorArray(validate.errors);
    const tree2 = summarizeAJVErrorTree(tree1, options);
    throw new AppmapError(stringifyTree(tree2, options), { list: validate.errors, tree: tree1 });
  }
};

const collectDesignator = (designators, entity) => {
  if (entity.type === 'function') {
    if (hasOwnProperty(entity, 'location') && entity.location !== null) {
      let path = entity.location;
      let lineno = null;
      if (path !== null && /:[0-9]+$/u.test(path)) {
        [, path, lineno] = /^([\s\S]*):([0-9]+)$/.exec(entity.location);
      }
      const designator = JSON.stringify([entity.name, path, parseInt(lineno), entity.static]);
      assert(
        !designators.has(designator),
        AppmapError,
        'detected a function code object clash in the classMap: %o',
        entity
      );
      designators.add(designator);
    }
  } else {
    for (let child of entity.children) {
      collectDesignator(designators, child);
    }
  }
};

const checkPerThreadFifoOrdering = (events) => {
  const threads = new Map();
  let max = 0;
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    assert(
      event.id > max,
      AppmapError,
      'non-monotonous event id between #%i and #%i',
      event.id,
      max
    );
    max = event.id;
    if (!threads.has(event.thread_id)) {
      threads.set(event.thread_id, []);
    }
    const thread = threads.get(event.thread_id);
    if (event.event === 'call') {
      // console.log(new Array(thread.length).join("."), event.id);
      thread.push(event);
    } else {
      const parent = thread.pop();
      // console.log(new Array(thread.length).join("."), event.id, event.parent_id);
      assert(
        parent.id === event.parent_id,
        AppmapError,
        'expected parent id of return event #%i to be %i but got %i',
        event.id,
        parent.id,
        event.parent_id
      );
      const tag1 = getCallTag(parent);
      const tag2 = getReturnTag(event);
      assert(
        tag2.includes(tag1),
        AppmapError,
        'incompatible event type between #%i and #%i, expected a %s but got a %s',
        event.id,
        event.parent_id,
        tag1,
        tag2
      );
    }
  }
};

const updateEventArray = (events, updates) => {
  for (const key of Reflect.ownKeys(updates)) {
    const id = parseInt(key);
    assert(
      events.find((event) => event.id === id),
      AppmapError,
      'event update #%i has no corresponding event',
      id
    );
  }
  return events.map((event) =>
    hasOwnProperty(updates, String(event.id)) ? updates[event.id] : event
  );
};

const normalizeVersion = (version) => {
  if (/^[0-9]+$/.test(version)) {
    return `${version}.0.0`;
  } else if (/^[0-9]+\.[0-9]+$/.test(version)) {
    return `${version}.0`;
  } else if (/^[0-9]+\.[0-9]+\.[0-9]+$/.test(version)) {
    return version;
  } else {
    throw InputError(`invalid version format: ${version}`);
  }
};

const checkClassmapFunction = (event, designators) => {
  if (event.event === 'call' && hasOwnProperty(event, 'method_id')) {
    const designator = JSON.stringify([event.method_id, event.path, event.lineno, event.static]);
    assert(designators.has(designator), AppmapError, 'missing function in classmap: %o', event);
  }
};

exports.AppmapError = AppmapError;

exports.InputError = InputError;

exports.validate = (data, options) => {
  // Normalize options //
  options = {
    'schema-depth': 0,
    'instance-depth': 0,
    version: null,
    ...options,
  };
  if (options.version === null) {
    assert(
      typeof data === 'object' && data !== null && hasOwnProperty(data, 'version'),
      AppmapError,
      'could not extract version from appmap'
    );
    options.version = data.version;
  }
  options.version = normalizeVersion(options.version);
  assert(
    versions.has(options.version),
    InputError,
    'unsupported appmap version %o; expected one of %o',
    options.version,
    keys
  );
  checkSchema(data, options);
  const designators = new Set();
  for (const entity of data.classMap) {
    collectDesignator(designators, entity, null, '');
  }
  for (const event of data.events) {
    checkClassmapFunction(event, designators);
  }
  checkPerThreadFifoOrdering(data.events);
  if (hasOwnProperty(data, 'eventUpdates')) {
    checkPerThreadFifoOrdering(updateEventArray(data.events, data.eventUpdates));
  }
  return options.version;
};
