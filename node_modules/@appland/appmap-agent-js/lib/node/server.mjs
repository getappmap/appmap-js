import process from "node:process";
import { updateGlobalConfiguration } from "./global.mjs";
import "./error.mjs";

const { loadProcessConfiguration } = await import(
  "../../dist/bundles/configuration-process.mjs"
);

const configuration = loadProcessConfiguration(process);

updateGlobalConfiguration(configuration);

const { mainAsync } = await import("../../dist/bundles/server.mjs");

export default mainAsync(process, configuration);
