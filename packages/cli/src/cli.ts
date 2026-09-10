#! /usr/bin/env node
import 'reflect-metadata';

import yargs from 'yargs';
import { setSQLErrorHandler } from '@appland/models';
import { Telemetry } from '@appland/telemetry';

import { default as sqlErrorLog } from './lib/sqlErrorLog';
import registerCommand from './lib/registerCommand';

// Each command module declares its name, description and options, and loads
// the module that implements it only when the command runs (see
// lib/lazyHandler). That keeps startup, and `appmap <command> --help`, from
// paying for dependencies that only other commands use.
import * as Depends from './cmds/depends';
import * as Index from './cmds/index/index';
import Openapi from './cmds/openapi/openapi';
import InstallAgent from './cmds/agentInstaller/install-agent';
import * as Open from './cmds/open/open';
import Record from './cmds/record/record';
import Status from './cmds/agentInstaller/status';
import * as Stats from './cmds/stats/stats';
import * as Inspect from './cmds/inspect/inspect';
import * as SequenceDiagram from './cmds/sequenceDiagram';
import * as SequenceDiagramDiff from './cmds/sequenceDiagramDiff';
import Prune from './cmds/prune/prune';
import Trim from './cmds/trim/trim';
import Sanitize from './cmds/sanitize/sanitize';
import * as Archive from './cmds/archive/archive';
import * as Restore from './cmds/archive/restore';
import * as Compare from './cmds/compare/compare';
import * as CompareReport from './cmds/compare-report/compareReport';
import * as Inventory from './cmds/inventory/inventory';
import * as InventoryReport from './cmds/inventory-report/inventoryReport';
import * as Search from './cmds/search/search';
import * as Rpc from './cmds/index/rpc';
import * as RpcClient from './cmds/rpcClient';
import * as Navie from './cmds/navie';
import * as Apply from './cmds/apply';
import * as Query from './cmds/query/query';
import * as RunTest from './cmds/runTest';
import TestTelemetry from './cmds/testTelemetry';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../package.json') as { version: string };

Telemetry.configure({
  product: {
    name: '@appland/appmap',
    version,
  },
});

setSQLErrorHandler(sqlErrorLog);

const parser = yargs(process.argv.slice(2));

registerCommand(parser, Depends);
registerCommand(parser, Index);
registerCommand(parser, Openapi);
registerCommand(parser, InstallAgent);
registerCommand(parser, Open);
registerCommand(parser, Record);
registerCommand(parser, Status);
registerCommand(parser, Stats);
registerCommand(parser, Inspect);
registerCommand(parser, SequenceDiagram);
registerCommand(parser, SequenceDiagramDiff);
registerCommand(parser, Prune);
registerCommand(parser, Trim);
registerCommand(parser, Sanitize);
registerCommand(parser, Archive);
registerCommand(parser, Restore);
registerCommand(parser, Compare);
registerCommand(parser, CompareReport);
registerCommand(parser, Inventory);
registerCommand(parser, InventoryReport);
registerCommand(parser, Search);
registerCommand(parser, Rpc);
registerCommand(parser, RpcClient);
registerCommand(parser, Navie);
registerCommand(parser, Apply);
registerCommand(parser, Query);
registerCommand(parser, RunTest);
registerCommand(parser, TestTelemetry);

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
