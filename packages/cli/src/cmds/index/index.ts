import readline from 'readline';
import yargs from 'yargs';

import FingerprintDirectoryCommand from '../../fingerprint/fingerprintDirectoryCommand';
import FingerprintWatchCommand from '../../fingerprint/fingerprintWatchCommand';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../lib/locateAppMapDir';
import { verbose } from '../../utils';
import { log, warn } from 'console';
import { numProcessed } from '../../rpc/index/numProcessed';
import { search } from '../../rpc/search/search';
import appmapFilter from '../../rpc/appmap/filter';
import { RpcHandler } from '../../rpc/rpc';
import metadata from '../../rpc/appmap/metadata';
import sequenceDiagram from '../../rpc/appmap/sequenceDiagram';
import { explainHandler, explainStatusHandler } from '../../rpc/explain/explain';
import RPCServer from './rpcServer';
import appmapData from '../../rpc/appmap/data';
import { loadConfiguration } from '@appland/client';

export const command = 'index';
export const describe =
  'Compute fingerprints and update index files for all appmaps in a directory';

export const builder = (args: yargs.Argv) => {
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
    alias: 'w',
  });
  args.option('port', {
    describe: 'port to listen on for JSON-RPC requests',
    type: 'number',
    alias: 'p',
  });
  args.options('watch-stat-delay', {
    type: 'number',
    default: 10,
    describe: 'delay between stat calls when watching, in milliseconds',
    hidden: true,
  });
  return args.strict();
};

export const handler = async (argv) => {
  verbose(argv.verbose);
  handleWorkingDirectory(argv.directory);
  const appmapDir = await locateAppMapDir(argv.appmapDir);

  const { watchStatDelay, watch, port } = argv;

  const runServer = watch || port !== undefined;
  if (port && !watch) warn(`Note: --port option implies --watch`);

  if (runServer) {
    loadConfiguration();

    log(`Running indexer in watch mode`);
    const cmd = new FingerprintWatchCommand(appmapDir);
    await cmd.execute(watchStatDelay);

    if (port !== undefined) {
      const rpcMethods: RpcHandler<any, any>[] = [
        numProcessed(cmd),
        search(appmapDir),
        appmapFilter(),
        appmapData(),
        metadata(),
        sequenceDiagram(),
        explainHandler(appmapDir),
        explainStatusHandler(),
      ];
      const rpcServer = new RPCServer(port, rpcMethods);
      rpcServer.start();
    } else {
      if (!argv.verbose && process.stdout.isTTY) {
        process.stdout.write('\x1B[?25l');
        const consoleLabel = 'AppMaps processed: 0';
        process.stdout.write(consoleLabel);
        setInterval(() => {
          readline.cursorTo(process.stdout, consoleLabel.length - 1);
          process.stdout.write(`${cmd.numProcessed}`);
        }, 1000);
      }
    }
  } else {
    const cmd = new FingerprintDirectoryCommand(appmapDir);
    await cmd.execute();
  }
};
