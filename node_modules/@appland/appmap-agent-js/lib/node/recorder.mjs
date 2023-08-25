import "./global.mjs";
import "./error.mjs";
import { configuration } from "./configuration.mjs";
export * from "./loader-esm.mjs";

const map = {
  __proto__: null,
  remote: "node",
  process: "node",
  mocha: "mocha",
  jest: "jest",
};

// Use top-level await to wait for ./configuration.mjs to update env variables.
const { recordAsync } = await import(
  `../../dist/bundles/recorder-${map[configuration.recorder]}.mjs`
);

await recordAsync(configuration);
