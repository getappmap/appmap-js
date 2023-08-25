#!/usr/bin/env node

const { process, Map } = globalThis;

const routes = new Map([
  ["init", "../lib/node/init.mjs"],
  ["setup", "../lib/node/setup.mjs"],
  ["run", "../lib/node/server.mjs"],
  ["server", "../lib/node/server.mjs"],
  ["client", "../lib/node/client.mjs"],
  ["version", "../lib/node/version.mjs"],
  ["--version", "../lib/node/version.mjs"],
  ["help", "../lib/node/help.mjs"],
  ["--help", "../lib/node/help.mjs"],
  ["status", "../lib/node/status.mjs"],
]);

let verb = "server";

if (routes.has(process.argv[2])) {
  verb = process.argv[2];
  process.argv = [process.argv[0], process.argv[1], ...process.argv.slice(3)];
}

import(routes.get(verb))
  .then(({ default: promise }) => {
    promise
      .then((status) => {
        process.exitCode = status;
      })
      .catch((error) => {
        throw error;
      });
  })
  .catch((error) => {
    throw error;
  });
