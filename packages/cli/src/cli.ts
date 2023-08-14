#! /usr/bin/env node
/* eslint-disable no-use-before-define */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable func-names */
/* eslint-disable max-classes-per-file */

const yargs = require('yargs');
const yaml = require('js-yaml');
const { promises: fsp, readFileSync } = require('fs');
const { queue } = require('async');
const readline = require('readline');
const { join } = require('path');
import { setSQLErrorHandler } from '@appland/models';

const { verbose } = require('./utils');
const FingerprintDirectoryCommand = require('./fingerprint/fingerprintDirectoryCommand');
const FingerprintWatchCommand = require('./fingerprint/fingerprintWatchCommand').default;
const Depends = require('./depends');
import InstallCommand from './cmds/agentInstaller/install-agent';
import StatusCommand from './cmds/agentInstaller/status';
import { default as OpenAPICommand } from './cmds/openapi';
import PruneCommand from './cmds/prune/prune';
import RecordCommand from './cmds/record/record';
import { handleWorkingDirectory } from './lib/handleWorkingDirectory';
import { locateAppMapDir } from './lib/locateAppMapDir';
const InventoryCommand = require('./inventoryCommand');
const OpenCommand = require('./cmds/open/open');
const InspectCommand = require('./cmds/inspect/inspect');
const SequenceDiagramCommand = require('./cmds/sequenceDiagram');
const SequenceDiagramDiffCommand = require('./cmds/sequenceDiagramDiff');
const StatsCommand = require('./cmds/stats/stats');
const ArchiveCommand = require('./cmds/archive/archive');
const RestoreCommand = require('./cmds/archive/restore');
const CompareCommand = require('./cmds/compare/compare');
import UploadCommand from './cmds/upload';
import { default as sqlErrorLog } from './lib/sqlErrorLog';

setSQLErrorHandler(sqlErrorLog);

// eslint-disable-next-line no-unused-expressions
yargs(process.argv.slice(2))
  .command(
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
  )
  .command(
    'index',
    'Compute fingerprints and update index files for all appmaps in a directory',
    (args) => {
      args.showHidden();

      args.option('directory', {
        describe: 'program working directory',
        type: 'string',
        alias: 'd',
      });
      args.option('appmap-dir', {
        describe: 'directory to recursively inspect for AppMaps',
      });
      args.option('watch', {
        describe: 'watch the directory for changes to appmaps',
        boolean: true,
      });
      args.options('watch-stat-delay', {
        type: 'number',
        default: 10,
        describe: 'delay between stat calls when watching, in milliseconds',
        hidden: true,
      });
      return args.strict();
    },
    async (argv) => {
      verbose(argv.verbose);
      handleWorkingDirectory(argv.directory);
      const appmapDir = await locateAppMapDir(argv.appmapDir);

      if (argv.watch) {
        const cmd = new FingerprintWatchCommand(appmapDir);
        await cmd.execute({ statDelayMs: argv.watchDelay });

        if (!argv.verbose && process.stdout.isTTY) {
          process.stdout.write('\x1B[?25l');
          const consoleLabel = 'AppMaps processed: 0';
          process.stdout.write(consoleLabel);
          setInterval(() => {
            readline.cursorTo(process.stdout, consoleLabel.length - 1);
            process.stdout.write(`${cmd.numProcessed}`);
          }, 1000);

          process.on('beforeExit', (/* _code */) => {
            process.stdout.write(`\x1B[?25h`);
          });
        }
      } else {
        const cmd = new FingerprintDirectoryCommand(appmapDir);
        await cmd.execute();
      }
    }
  )
  .command(
    'inventory',
    'Generate canonical lists of the application code object inventory',
    (args) => {
      args.option('directory', {
        describe: 'program working directory',
        type: 'string',
        alias: 'd',
      });
      args.option('appmap-dir', {
        describe: 'directory to recursively inspect for AppMaps',
      });
      return args.strict();
    },
    async (argv) => {
      verbose(argv.verbose);
      handleWorkingDirectory(argv.directory);
      const appmapDir = await locateAppMapDir(argv.appmapDir);

      await new FingerprintDirectoryCommand(appmapDir).execute();

      const inventory = await new InventoryCommand(appmapDir).execute();
      console.log(yaml.dump(inventory));
    }
  )
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
    process.exit(1);
  })
  .command(OpenAPICommand)
  .command(InstallCommand)
  .command(OpenCommand)
  .command(RecordCommand)
  .command(StatusCommand)
  .command(StatsCommand)
  .command(InspectCommand)
  .command(SequenceDiagramCommand)
  .command(SequenceDiagramDiffCommand)
  .command(PruneCommand)
  .command(UploadCommand)
  .command(ArchiveCommand)
  .command(RestoreCommand)
  .command(CompareCommand)
  .strict()
  .demandCommand()
  .help().argv;
