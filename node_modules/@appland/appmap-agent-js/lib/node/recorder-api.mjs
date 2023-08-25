import { cwd } from "node:process";
import { pathToFileURL } from "node:url";
import "./global.mjs";
import "./error.mjs";

const url = pathToFileURL(cwd()).toString();

const { Appmap } = await import("../../dist/bundles/recorder-api.mjs");

export const createAppMap = (home = url, conf = {}, base = url) =>
  new Appmap(home, conf, base);
