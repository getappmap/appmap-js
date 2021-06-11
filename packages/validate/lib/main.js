const { parse: yaml } = require("yaml");
const Ajv = require("ajv");
const { readFileSync } = require("fs");
const { InvalidAppmapError, InputError, assert, assertSuccess } = require("./assert.js");

const versions = new Map([
  ["1.6", "1-6-0"],
  ["1.6.0", "1-6-0"],
]);

const keys = Array.from(versions.keys());

const ajv = new Ajv();

const cache = new Map();

const makeDesignator = JSON.stringify;

const getCallTag = (event) => {
  assert(event.event === "call", Error, "expected a call event");
  if (Reflect.getOwnPropertyDescriptor(event, "method_id") !== undefined) {
    return "function";
  }
  if (Reflect.getOwnPropertyDescriptor(event, "http_client_request") !== undefined) {
    return "http-client";
  }
  if (Reflect.getOwnPropertyDescriptor(event, "http_server_request") !== undefined) {
    return "http-server";
  }
  if (Reflect.getOwnPropertyDescriptor(event, "sql_query") !== undefined) {
    return "sql";
  }
  /* c8 ignore start */
  assert(false, Error, "invalid event");
  /* c8 ignore stop */
};

const getReturnTag = (event) => {
  assert(event.event === "return", Error, "expected a return event");
  if (
    Reflect.getOwnPropertyDescriptor(event, "return_value") !== undefined ||
    Reflect.getOwnPropertyDescriptor(event, "exceptions") !== undefined
  ) {
    return "function";
  }
  if (Reflect.getOwnPropertyDescriptor(event, "http_client_response") !== undefined) {
    return "http-client";
  }
  if (Reflect.getOwnPropertyDescriptor(event, "http_server_response") !== undefined) {
    return "http-server";
  }
  return null;
};

exports.validate = (options) => {
  // Normalize options //
  options = {
    path: null,
    data: null,
    version: "1.6.0",
    ...options,
  };
  assert(
    typeof options.version === "string" && versions.has(options.version),
    InputError,
    "invalid version %o, it should be one of: %o",
    options.version,
    keys
  );
  options.version = versions.get(options.version);
  assert(
    (options.path === null) !== (options.data === null),
    InputError,
    `either path or data must be provided, got: path = %o and data = %o`,
    options.path,
    options.data
  );
  if (options.path !== null) {
    const content = assertSuccess(() => readFileSync(options.path, "utf8"), InputError, "%s");
    options.data = assertSuccess(
      () => JSON.parse(content),
      InvalidAppmapError,
      `could not JSON-parse file %o >> %s`,
      options.path
    );
  }
  // Validate against json schema //
  if (!cache.has(options.version)) {
    ajv.addSchema(yaml(readFileSync(`${__dirname}/../schema/${options.version}.yml`, "utf8")));
    cache.set(options.version, ajv.getSchema(`appmap-${options.version}`));
  }
  const validate = cache.get(options.version);
  assert(
    validate(options.data),
    InvalidAppmapError,
    "appmap failed schema validation >> %o",
    validate.errors
  );
  const events = options.data.events;
  // Verify the unicity of code object //
  const designators = new Set();
  const collectDesignator = (entity, parent, path1) => {
    if (entity.type === "function") {
      assert(
        parent !== null,
        Error,
        "this appmap should not have passed ajv (function code objects should not appear at the top-level)"
      );
      const [, path2, lineno] = /^([\s\S]*):([0-9]+)$/.exec(entity.location);
      assert(
        path1.startsWith(path2),
        InvalidAppmapError,
        "path should be a prefix of %o for function code object %o",
        path1,
        entity
      );
      const designator = makeDesignator([
        path2,
        parseInt(lineno),
        parent.name,
        entity.static,
        entity.name,
      ]);
      assert(
        !designators.has(designator),
        InvalidAppmapError,
        "detected a function code object clash in the classMap: %o",
        entity
      );
      designators.add(designator);
    } else {
      path1 = `${path1}${entity.name}/`;
      for (let child of entity.children) {
        collectDesignator(child, entity, path1);
      }
    }
  };
  for (let entity of options.data.classMap) {
    collectDesignator(entity, null, "");
  }
  // Verify the unicity of event.id and event.parent_id //
  for (let index1 = 0; index1 < events.length; index1 += 1) {
    const event1 = events[index1];
    for (let index2 = index1 + 1; index2 < events.length; index2 += 1) {
      const event2 = events[index2];
      assert(
        event1.id !== event2.id,
        InvalidAppmapError,
        "duplicate event id between #%i and #%i (ie between %o and %o)",
        index1,
        index2,
        event1,
        event2
      );
      if (event1.event == "return" && event2.event === "return") {
        assert(
          event1.parent_id !== event2.parent_id,
          InvalidAppmapError,
          "duplicate event parent_id between #%i and #%i (ie between %o and %o)",
          index1,
          index2,
          event1,
          event2
        );
      }
    }
  }
  // Verify that
  //   - each return event is matched by a call event
  //   - each function call event matches a code object
  for (let index1 = 0; index1 < events.length; index1 += 1) {
    const event1 = events[index1];
    if (event1.event === "call") {
      if (Reflect.getOwnPropertyDescriptor(event1, "method_id")) {
        const designator = makeDesignator([
          event1.path,
          event1.lineno,
          event1.defined_class,
          event1.static,
          event1.method_id,
        ]);
        assert(
          designators.has(designator),
          InvalidAppmapError,
          "could not find a match in the classMap for the function call event #%i (%o): %o is not in %o",
          index1,
          event1,
          designator,
          designators
        );
      }
    } else {
      assert(event1.event === "return", Error, "this appmap should not have passed ajv");
      const index2 = events.findIndex((event2) => event2.id === event1.parent_id);
      assert(index2 !== -1, "missing matching call event for #%i -- ie: %o", index1, event1);
      const event2 = events[index2];
      const tag1 = getReturnTag(event1);
      const tag2 = getCallTag(event2);
      assert(
        tag1 === null || tag1 === tag2,
        InvalidAppmapError,
        "type mismatch (%s !== %s) between call-return event pair (#%i, #%i) -- ie: (%o, %o)",
        tag2,
        tag1,
        index2,
        index1,
        event2,
        event1
      );
    }
  }
};
