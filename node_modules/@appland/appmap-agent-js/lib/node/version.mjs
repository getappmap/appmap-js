import { createRequire } from "node:module";

const { Promise, URL, process } = globalThis;

const require = createRequire(new URL(import.meta.url));

const { name, version } = require("../../package.json");

export default new Promise((resolve, reject) => {
  process.stdout.write(`${name}@${version}${"\n"}`, "utf8", (error) => {
    if (error) {
      reject(error);
    } else {
      resolve(0);
    }
  });
});
