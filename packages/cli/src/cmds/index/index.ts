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
import appmapStats from '../../rpc/appmap/stats';
import LocalNavie from '../../rpc/explain/navie/navie-local';
import RemoteNavie from '../../rpc/explain/navie/navie-remote';
import { ContextProvider } from '../../rpc/explain/navie/inavie';

const AI_KEYS = ['OPENAI_API_KEY'];

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
  args.option('navie-provider', {
    describe: 'navie provider to use',
    type: 'string',
    choices: ['local', 'remote'],
  });
  args.option('ai-keys', {
    describe: 'Space-delimited list of AI keys to use to initialize local Navie',
    type: 'string',
    default: AI_KEYS.join(' '),
  });

  return args.strict();
};

export const handler = async (argv) => {
  verbose(argv.verbose);
  handleWorkingDirectory(argv.directory);
  const appmapDir = await locateAppMapDir(argv.appmapDir);

  const { watch, port } = argv;

  const runServer = watch || port !== undefined;
  if (port && !watch) warn(`Note: --port option implies --watch`);

  if (runServer) {
    loadConfiguration(false);

    log(`Running indexer in watch mode`);
    const cmd = new FingerprintWatchCommand(appmapDir);
    await cmd.execute();

    if (port !== undefined) {
      const useLocalNavie = () => {
        if (argv.navieProvider === 'local') {
          log(`Using local Navie provider due to explicit --navie-provider=local option`);
          return true;
        }

        if (argv.navieProvider === 'remote') {
          log(`Using remote Navie provider due to explicit --navie-provider=remote option`);
          return false;
        }

        const aiKeys = argv.aiKeys.split(' ');
        const aiEnvVar = Object.keys(process.env).find((key) => aiKeys.includes(key));
        if (aiEnvVar) {
          log(`Using local Navie provider due to presence of environment variable '${aiEnvVar}'`);
          return true;
        }

        log(`Using remote Navie provider due to absence of --navie-provider option and AI keys`);
        return false;
      };

      const buildLocalNavie = (threadId: string | undefined, contextProvider: ContextProvider) =>
        new LocalNavie(threadId, contextProvider);
      const buildRemoteNavie = (threadId: string | undefined, contextProvider: ContextProvider) =>
        new RemoteNavie(threadId, contextProvider);

      const navieProvider = useLocalNavie() ? buildLocalNavie : buildRemoteNavie;

      const rpcMethods: RpcHandler<any, any>[] = [
        numProcessed(cmd),
        search(appmapDir),
        appmapStats(appmapDir),
        appmapFilter(),
        appmapData(),
        metadata(),
        sequenceDiagram(),
        explainHandler(navieProvider, appmapDir),
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
