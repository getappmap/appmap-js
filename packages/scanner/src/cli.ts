#!/usr/bin/env node

import yargs from 'yargs';
import ScanCommand from './cli/scan/command';
import { verbose } from './rules/lib/util';
import { AbortError, ValidationError } from './errors';
import { ExitCode } from './cli/exitCode';
import { Telemetry, TelemetryData } from '@appland/telemetry';
import { setSQLErrorHandler } from '@appland/models';
import sqlWarning from './sqlWarning';

function errorInfo(err: Error) {
  if (err instanceof ValidationError)
    return { label: 'validation-error', code: ExitCode.ValidationError };
  else if (err instanceof AbortError) return { label: 'abort', code: ExitCode.AbortError };
  else return { label: 'error', code: ExitCode.RuntimeError };
}

function handleError(err: Error) {
  const { label, code } = errorInfo(err);
  process.exitCode = code;

  const telemetry: TelemetryData = {
    name: [process.argv[2], label].join(':'),
    properties: { error: err.message },
  };

  if (label === 'error') telemetry.properties!.errorStack = err.stack;

  Telemetry.sendEvent(telemetry);
}

Telemetry.configure({
  product: {
    name: '@appland/scanner',
    // Importing this would change the directory structure of our build, so we use require
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    version: require('../package.json').version,
  },
});

setSQLErrorHandler(sqlWarning);

yargs(process.argv.slice(2))
  .option('verbose', {
    describe: 'Show verbose output',
    alias: 'v',
  })
  .command(ScanCommand)
  .fail((msg, err, yargs) => {
    if (msg) {
      console.warn(yargs.help());
      console.warn(msg);
    } else if (err) {
      if (verbose()) {
        console.error(err);
      } else {
        console.error(err.message);
      }
    }
    process.exitCode = ExitCode.ValidationError;
  })
  .exitProcess(false)
  .strict()
  .demandCommand()
  .help()
  .parseAsync()
  .catch(handleError);
