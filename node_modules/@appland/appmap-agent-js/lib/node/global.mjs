/* eslint-disable local/global-object-access */

const {
  Reflect: { defineProperty },
} = globalThis;

const define = (object, key, value) => {
  defineProperty(object, key, {
    __proto__: null,
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  });
};

define(globalThis, "__APPMAP_LOG_FILE__", 1);
define(globalThis, "__APPMAP_LOG_LEVEL__", "info");
define(globalThis, "__APPMAP_SOCKET__", "net");

export const updateGlobalConfiguration = (configuration) => {
  define(globalThis, "__APPMAP_LOG_FILE__", configuration.log.file);
  define(globalThis, "__APPMAP_LOG_LEVEL__", configuration.log.level);
  define(globalThis, "__APPMAP_SOCKET__", configuration.socket);
};
