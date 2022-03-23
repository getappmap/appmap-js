#!/usr/bin/env node

import yargs from 'yargs';
import ScanCommand from './cli/scan/command';
import UploadCommand from './cli/upload/command';
import CICommand from './cli/ci/command';
import MergeCommand from './cli/merge/command';
import { verbose } from './rules/lib/util';
import { AbortError, ValidationError } from './errors';
import { ExitCode } from './cli/exitCode';

yargs(process.argv.slice(2))
  .option('verbose', {
    describe: 'Show verbose output',
    alias: 'v',
  })
  .command(ScanCommand)
  .command(UploadCommand)
  .command(CICommand)
  .command(MergeCommand)
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

      if (err instanceof ValidationError) {
        process.exit(ExitCode.ValidationError);
      }
      if (err instanceof AbortError) {
        process.exit(ExitCode.AbortError);
      }
      if (err instanceof Error) {
        process.exit(ExitCode.RuntimeError);
      }
    }
    process.exit(1);
  })
  .strict()
  .demandCommand()
  .help().argv;
