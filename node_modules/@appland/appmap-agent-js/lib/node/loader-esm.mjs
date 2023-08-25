/* eslint-disable local/global-object-access */

import { version, stdout } from "node:process";

const {
  undefined,
  Error,
  parseInt,
  Reflect: { defineProperty, getOwnPropertyDescriptor },
} = globalThis;

const message =
  "Treating main file as commonjs, this might not always be appropriate -- cf: https://github.com/nodejs/node/issues/41465\n";

const parseMajorVersion = (version) => {
  const parts = /^v([0-9]+)\./u.exec(version);
  if (parts === null) {
    throw new Error("could not parse node version");
  } else {
    return parseInt(parts[1]);
  }
};

const major_node_version = parseMajorVersion(version);

export const transformSourceDefault = (content, context, next) =>
  next(content, context, next);
export const loadDefault = (url, context, next) => next(url, context, next);

// Depending on node version, this module maybe loaded twice.
// We use a global variable to make sure we have a single reference for hooks.
if (getOwnPropertyDescriptor(globalThis, "__APPMAP_HOOK_ESM__") === undefined) {
  defineProperty(globalThis, "__APPMAP_HOOK_ESM__", {
    __proto__: null,
    value: {
      main: true,
      transformSource: transformSourceDefault,
      load: loadDefault,
    },
    writable: true,
    configurable: true,
    enumerable: false,
  });
}

export const hooks = globalThis.__APPMAP_HOOK_ESM__;

export const getFormat =
  major_node_version >= 16
    ? undefined
    : (url, context, next) => {
        if (hooks.main) {
          hooks.main = false;
          try {
            return next(url, context, next);
          } catch {
            stdout.write(message);
            return { format: "commonjs" };
          }
        } else {
          return next(url, context, next);
        }
      };

export const transformSource =
  major_node_version >= 16
    ? undefined
    : (content, context, next) => hooks.transformSource(content, context, next);

export const load =
  major_node_version >= 16
    ? (url, context, next) => {
        if (hooks.main) {
          hooks.main = false;
          if (context.format === undefined) {
            stdout.write(message);
            context.format = "commonjs";
          }
        }
        return hooks.load(url, context, next);
      }
    : undefined;
