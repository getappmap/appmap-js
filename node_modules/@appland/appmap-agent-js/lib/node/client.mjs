import { default as process } from "node:process";
import { updateGlobalConfiguration } from "./global.mjs";
import "./error.mjs";

const { loadProcessConfiguration } = await import(
  "../../dist/bundles/configuration-process.mjs"
);

const configuration = loadProcessConfiguration(process);

updateGlobalConfiguration(configuration);

const { mainAsync } = await import("../../dist/bundles/client.mjs");

export default mainAsync(process, configuration);
