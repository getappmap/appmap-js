import { env } from "node:process";
import { updateGlobalConfiguration } from "./global.mjs";

const { loadEnvironmentConfiguration } = await import(
  "../../dist/bundles/configuration-environment.mjs"
);

export const configuration = loadEnvironmentConfiguration(env);

updateGlobalConfiguration(configuration);
