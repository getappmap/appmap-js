#! /usr/bin/env node
/* eslint-disable no-use-before-define */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable func-names */
/* eslint-disable max-classes-per-file */

import 'reflect-metadata';

/* eslint-disable global-require, @typescript-eslint/no-var-requires */
const yargs = require('yargs');
const { promises: fsp, readFileSync } = require('fs');
const { queue } = require('async');
const { join } = require('path');
import { setSQLErrorHandler } from '@appland/models';
import { Telemetry } from '@appland/telemetry';
import { default as sqlErrorLog } from './lib/sqlErrorLog';
import lazyCommand from './lib/lazyCommand';
import commands from './cliCommands';

Telemetry.configure({
  product: {
    name: '@appland/appmap',
    version: require('../package.json').version,
  },
});

setSQLErrorHandler(sqlErrorLog);

const parser = yargs(process.argv.slice(2));

parser.command(
  'depends [files]',
  'Compute a list of AppMaps that are out of date',
  (args) => {
    args.option('directory', {
      describe: 'program working directory',
      type: 'string',
      alias: 'd',
    });
    args.positional('files', {
      describe: 'provide an explicit list of dependency files',
    });
    args.option('appmap-dir', {
      describe: 'directory to recursively inspect for AppMaps',
    });
    args.option('base-dir', {
      describe: 'directory to prepend to each dependency source file',
      default: '.',
    });
    args.option('field', {
      describe: 'print a field from each matching AppMap',
    });
    args.option('stdin-files', {
      describe: 'read the list of changed files from stdin, one file per line',
      boolean: true,
    });
    return args.strict();
  },
  async (argv) => {
    const { verbose } = require('./utils');
    const { handleWorkingDirectory } = require('./lib/handleWorkingDirectory');
    const { locateAppMapDir } = require('./lib/locateAppMapDir');
    const Depends = require('./depends');

    verbose(argv.verbose);
    handleWorkingDirectory(argv.directory);
    const appmapDir = await locateAppMapDir(argv.appmapDir);

    let { files } = argv;
    if (argv.stdinFiles) {
      const stdinFileStr = readFileSync(0).toString();
      const stdinFiles = stdinFileStr.split('\n');
      files = (files || []).concat(stdinFiles);
      if (verbose()) {
        console.warn(`Computing depends on ${files.join(', ')}`);
      }
    }

    if (verbose()) {
      console.warn(`Testing AppMaps in ${appmapDir}`);
    }

    const depends = new Depends(appmapDir);
    if (argv.baseDir) {
      depends.baseDir = argv.baseDir;
    }
    if (files) {
      depends.files = files;
    }

    const appMapNames = await depends.depends();
    const values: any[] = [];
    if (argv.field) {
      const { field } = argv;
      const q = queue(async (appMapBaseName: string) => {
        const data = await fsp.readFile(join(appMapBaseName, 'metadata.json'));
        const metadata = JSON.parse(data);
        const value = metadata[field];
        if (value) {
          const tokens = value.split(':');
          values.push(tokens[0]);
        } else {
          console.warn(`No ${field} in ${appMapBaseName}`);
        }
      }, 2);
      appMapNames.forEach((name) => q.push(name));
      if (!q.idle()) await q.drain();
    } else {
      appMapNames.forEach((name) => values.push(name));
    }
    console.log(Array.from(new Set(values)).sort().join('\n'));
  }
);

// Subcommand modules are loaded on dispatch, not at startup; see cliCommands.ts.
commands.forEach((spec) => parser.command(lazyCommand(spec)));

// eslint-disable-next-line no-unused-expressions
parser
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging',
  })
  .fail((msg, err, yargs) => {
    if (msg) {
      console.log(yargs.help());
      console.log(msg);
    } else if (err) {
      if (err.cause) {
        console.error(err.message);
        console.error(err.cause);
      } else {
        console.error(err);
      }
    }
    process.exitCode = 1;
  })
  .strict()
  .demandCommand()
  .help().argv;
