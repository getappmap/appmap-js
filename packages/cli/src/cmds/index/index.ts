import readline from 'readline';
import yargs from 'yargs';
import jayson, { MethodLike } from 'jayson';

import FingerprintDirectoryCommand from '../../fingerprint/fingerprintDirectoryCommand';
import FingerprintWatchCommand from '../../fingerprint/fingerprintWatchCommand';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../lib/locateAppMapDir';
import { verbose } from '../../utils';
import { warn } from 'console';
import { numProcessed } from '../../rpc/index/numProcessed';
import { search } from '../../rpc/search/search';
import appmapFilter from '../../rpc/appmap/filter';
import { RpcCallback, RpcError } from '../../rpc/rpc';
import assert from 'assert';

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

function handlerMiddleware(
  name: string,
  handler: (args: any, callback: RpcCallback<any>) => void | Promise<void>
): (args: any, callback: RpcCallback<any>) => Promise<void> {
  return async (args, callback) => {
    warn(`Handling JSON-RPC request for ${name} (${JSON.stringify(args)})`);
    try {
      await handler(args, callback);
    } catch (err) {
      const error: RpcError = { code: 500 };
      if (err instanceof Error) error.message = err.message;
      callback(error);
    }
  };
}

export const handler = async (argv) => {
  verbose(argv.verbose);
  handleWorkingDirectory(argv.directory);
  const appmapDir = await locateAppMapDir(argv.appmapDir);

  const { watchStatDelay, watch, port } = argv;

  const runServer = watch || port;
  if (port && !watch) warn(`Note: --port option implies --watch`);

  if (runServer) {
    warn(`Running indexer in watch mode`);
    const cmd = new FingerprintWatchCommand(appmapDir);
    await cmd.execute(watchStatDelay);

    if (port) {
      warn(`Running JSON-RPC server on port ${port}.`);

      const rpcMethods: Record<string, MethodLike> = [
        numProcessed(cmd),
        search(appmapDir),
        appmapFilter(),
      ].reduce((acc, handler) => {
        acc[handler.name] = handlerMiddleware(handler.name, handler.handler);
        return acc;
      }, {});

      warn(`Available JSON-RPC methods: ${Object.keys(rpcMethods).sort().join(', ')}`);
      warn(`Consult @appland/rpc for request and response data types.`);

      const server = new jayson.Server(rpcMethods);
      server.http().listen(port);
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
