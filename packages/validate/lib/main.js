const { readFileSync } = require("fs");
const YAML = require("yaml");
const Ajv = require("ajv");
const { asTree } = require("treeify");
const { structureAJVErrorArray, summarizeAJVErrorTree } = require("ajv-error-tree");
const { getVersionMapping } = require("./version.js");
const { AppmapError, InputError, assert, assertSuccess } = require("./assert.js");

const ajv = new Ajv({
  verbose: true,
});
// jsPropertySyntax: true
const versions = getVersionMapping();

const keys = Array.from(versions.keys());

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

exports.AppmapError = AppmapError;

exports.InputError = InputError;

exports.validate = (options) => {
  // Normalize options //
  options = {
    "schema-depth": 0,
    "instance-depth": 0,
    path: null,
    data: null,
    version: null,
    ...options,
  };
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
      AppmapError,
      `could not JSON-parse file %o >> %s`,
      options.path
    );
  }
  if (options.version === null) {
    assert(
      typeof options.data === "object" &&
        options.data !== null &&
        Reflect.getOwnPropertyDescriptor(options.data, "version") !== undefined,
      AppmapError,
      "could extract version from appmap"
    );
    options.version = options.data.version;
  }
  if (/^[0-9]+\.[0-9]+$/.test(options.version)) {
    options.version = `${options.version}.0`;
  }
  assert(
    versions.has(options.version),
    InputError,
    "unsupported appmap version %o; expected one of %o",
    options.version,
    keys
  );
  // Validate against json schema //
  if (!cache.has(options.version)) {
    const schema = YAML.parse(readFileSync(versions.get(options.version), "utf8"));
    cache.set(options.version, ajv.compile(schema));
  }
  const validate = cache.get(options.version);
  if (!validate(options.data)) {
    const tree1 = structureAJVErrorArray(validate.errors);
    const tree2 = summarizeAJVErrorTree(tree1, options);
    let message;
    if (options["schema-depth"] === 0 && options["instance-depth"] === 0) {
      message = typeof tree2 === "string" ? tree2 : asTree(tree2, true);
    } else {
      message = YAML.stringify(tree2);
    }
    throw new AppmapError(message, { list: validate.errors, tree: tree1 });
  }
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
      if (
        Reflect.getOwnPropertyDescriptor(entity, "location") !== undefined &&
        entity.location !== null
      ) {
        let path2 = entity.location;
        let lineno = null;
        if (path2 !== null && /:[0-9]+$/u.test(path2)) {
          [, path2, lineno] = /^([\s\S]*):([0-9]+)$/.exec(entity.location);
        }
        // assert(
        //   path1.toLowerCase().startsWith(path2.toLowerCase()),
        //   AppmapError,
        //   "path should be a prefix of %o for function code object %o",
        //   path1,
        //   entity
        // );
        const designator = makeDesignator([path2, parseInt(lineno), entity.static, entity.name]);
        assert(
          !designators.has(designator),
          AppmapError,
          "detected a function code object clash in the classMap: %o",
          entity
        );
        designators.add(designator);
      }
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
        AppmapError,
        "duplicate event id between #%i and #%i (ie between %o and %o)",
        index1,
        index2,
        event1,
        event2
      );
      if (event1.event == "return" && event2.event === "return") {
        assert(
          event1.parent_id !== event2.parent_id,
          AppmapError,
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
          event1.static,
          event1.method_id,
        ]);
        assert(
          designators.has(designator),
          AppmapError,
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
        AppmapError,
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
  // Return //
  return options.version;
};
