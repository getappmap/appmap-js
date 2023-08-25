import { default as process, stderr } from "node:process";
import "./global.mjs";

const { reportError } = await import("../../dist/bundles/error.mjs");
const { reportException } = await import(
  "../../dist/bundles/crash-reporter.mjs"
);

process.on("uncaughtExceptionMonitor", (error) => {
  reportException(error);
  stderr.write(reportError(error));
});
