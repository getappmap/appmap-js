#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const command_1 = __importDefault(require("./cli/scan/command"));
const command_2 = __importDefault(require("./cli/upload/command"));
const command_3 = __importDefault(require("./cli/ci/command"));
const command_4 = __importDefault(require("./cli/merge/command"));
const util_1 = require("./rules/lib/util");
const errors_1 = require("./errors");
const exitCode_1 = require("./cli/exitCode");
const telemetry_1 = __importDefault(require("./telemetry"));
const models_1 = require("@appland/models");
const sqlWarning_1 = __importDefault(require("./sqlWarning"));
function errorInfo(err) {
    if (err instanceof errors_1.ValidationError)
        return { label: 'validation-error', code: exitCode_1.ExitCode.ValidationError };
    else if (err instanceof errors_1.AbortError)
        return { label: 'abort', code: exitCode_1.ExitCode.AbortError };
    else
        return { label: 'error', code: exitCode_1.ExitCode.RuntimeError };
}
function handleError(err) {
    const { label, code } = errorInfo(err);
    process.exitCode = code;
    const telemetry = {
        name: [process.argv[2], label].join(':'),
        properties: { error: err.message },
    };
    if (label === 'error')
        telemetry.properties.errorStack = err.stack;
    telemetry_1.default.sendEvent(telemetry);
}
(0, models_1.setSQLErrorHandler)(sqlWarning_1.default);
(0, yargs_1.default)(process.argv.slice(2))
    .option('verbose', {
    describe: 'Show verbose output',
    alias: 'v',
})
    .command(command_1.default)
    .command(command_2.default)
    .command(command_3.default)
    .command(command_4.default)
    .fail((msg, err, yargs) => {
    if (msg) {
        console.warn(yargs.help());
        console.warn(msg);
    }
    else if (err) {
        if ((0, util_1.verbose)()) {
            console.error(err);
        }
        else {
            console.error(err.message);
        }
    }
    process.exitCode = exitCode_1.ExitCode.ValidationError;
})
    .exitProcess(false)
    .strict()
    .demandCommand()
    .help()
    .parseAsync()
    .catch(handleError);
