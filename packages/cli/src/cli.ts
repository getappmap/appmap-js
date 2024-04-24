#! /usr/bin/env node
/* eslint-disable no-use-before-define */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable func-names */
/* eslint-disable max-classes-per-file */

import yargs from 'yargs';
import { readFileSync } from 'fs';
import * as fsp from 'fs/promises';
import { queue } from 'async';
import { join } from 'path';
import { setSQLErrorHandler } from '@appland/models';

import { verbose } from './utils';
import * as IndexCommand from './cmds/index/index';
import Depends from './depends';
import InstallCommand from './cmds/agentInstaller/install-agent';
import StatusCommand from './cmds/agentInstaller/status';
import { default as OpenAPICommand } from './cmds/openapi/openapi';
import PruneCommand from './cmds/prune/prune';
import RecordCommand from './cmds/record/record';
import { handleWorkingDirectory } from './lib/handleWorkingDirectory';
import { locateAppMapDir } from './lib/locateAppMapDir';
import * as OpenCommand from './cmds/open/open';
import * as InspectCommand from './cmds/inspect/inspect';
import * as SequenceDiagramDiffCommand from './cmds/sequenceDiagramDiff';
import * as SequenceDiagramCommand from './cmds/sequenceDiagram';
import * as StatsCommand from './cmds/stats/stats';
import * as ArchiveCommand from './cmds/archive/archive';
import * as RestoreCommand from './cmds/archive/restore';
import * as CompareCommand from './cmds/compare/compare';
import * as CompareReportCommand from './cmds/compare-report/compareReport';
import * as InventoryCommand from './cmds/inventory/inventory';
import * as InventoryReportCommand from './cmds/inventory-report/inventoryReport';
import * as SearchCommand from './cmds/search/search';
import * as RpcCommand from './cmds/index/rpc';
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
  .command(IndexCommand)
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
  .command(CompareReportCommand)
  .command(InventoryCommand)
  .command(InventoryReportCommand)
  .command(SearchCommand)
  .command(RpcCommand)
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
  .strict()
  .demandCommand()
  .help().argv;
