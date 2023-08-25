import { argv, cwd } from "node:process";
import "./global.mjs";
import "./error.mjs";

const { main } = await import("../../dist/bundles/status.mjs");

const root = argv[2] || cwd();

export default main(root);
