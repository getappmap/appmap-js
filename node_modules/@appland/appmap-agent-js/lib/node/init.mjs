import "./global.mjs";
import "./error.mjs";

const {
  process: { argv, cwd },
} = globalThis;

const { main } = await import("../../dist/bundles/init.mjs");

const root = argv[2] || cwd();

export default main(root);
