import readline from 'readline';
import yargs from 'yargs';
import chalk from 'chalk';
import { loadConfiguration } from '@appland/client';
import { ContextV2, Help, ProjectInfo, TestInvocation } from '@appland/navie';

import FingerprintDirectoryCommand from '../../fingerprint/fingerprintDirectoryCommand';
import FingerprintWatchCommand from '../../fingerprint/fingerprintWatchCommand';
import { configureRpcDirectories, handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
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
import { appmapStatsV1, appmapStatsV2 } from '../../rpc/appmap/stats';
import LocalNavie from '../../rpc/explain/navie/navie-local';
import { InteractionEvent } from '@appland/navie/dist/interaction-history';
import { update } from '../../rpc/file/update';
import { AI_KEY_ENV_VARS } from './aiEnvVar';
import NopNavie from '../../rpc/explain/navie/navie-nop';
import NavieService from '../../rpc/navie/services/navieService';
import { ThreadIndexService } from '../../rpc/navie/services/threadIndexService';

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
  args.option('log-navie', {
    describe: 'Log Navie events to stderr',
    boolean: true,
    default: false,
  });

  return args.strict();
};

export const handler = async (argv) => {
  verbose(argv.verbose);
  handleWorkingDirectory(argv.directory);
  const appmapDir = await locateAppMapDir(argv.appmapDir);

  const { watch, port, logNavie } = argv;

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

        const aiEnvVar = Object.keys(process.env).find((key) => AI_KEY_ENV_VARS.includes(key));
        if (aiEnvVar) {
          log(`Using local Navie provider due to presence of environment variable ${aiEnvVar}`);
          return true;
        }

        log(
          `--navie-provider option not provided, and none of ${AI_KEY_ENV_VARS.join(
            ' '
          )} are available. Using remote Navie provider.`
        );
        return false;
      };

      const buildLocalNavie = (
        contextProvider: ContextV2.ContextProvider,
        projectInfoProvider: ProjectInfo.ProjectInfoProvider,
        helpProvider: Help.HelpProvider,
        testInvocationProvider: TestInvocation.TestInvocationProvider
      ) => {
        const navie = new LocalNavie(
          contextProvider,
          projectInfoProvider,
          helpProvider,
          testInvocationProvider
        );

        let START: number | undefined;

        const logEvent = (event: InteractionEvent) => {
          if (!logNavie) return;

          if (!START) START = Date.now();

          const elapsed = Date.now() - START;
          process.stderr.write(chalk.gray(`${elapsed}ms `));
          process.stderr.write(chalk.gray(event.message));
          process.stderr.write(chalk.gray('\n'));
        };

        navie.on('event', logEvent);
        return navie;
      };
      const buildRemoteNavie = () => new NopNavie();

      const navieProvider = useLocalNavie() ? buildLocalNavie : buildRemoteNavie;
      await ThreadIndexService.useDefault();
      NavieService.bindNavieProvider(navieProvider);

      await configureRpcDirectories([process.cwd()]);

      const rpcMethods: RpcHandler<any, any>[] = [
        numProcessed(cmd),
        search(),
        appmapStatsV1(),
        appmapStatsV2(), // Forwards compatibility for @appland/components v4.11.0 and onwards
        appmapFilter(),
        appmapData(),
        metadata(),
        sequenceDiagram(),
        explainHandler(navieProvider, argv.codeEditor),
        explainStatusHandler(),
        update(navieProvider),
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
