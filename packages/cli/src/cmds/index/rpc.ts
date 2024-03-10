import yargs from 'yargs';
import chalk from 'chalk';

import { verbose } from '../../utils';
import { log } from 'console';
import { search } from '../../rpc/search/search';
import appmapFilter from '../../rpc/appmap/filter';
import { RpcHandler } from '../../rpc/rpc';
import metadata from '../../rpc/appmap/metadata';
import sequenceDiagram from '../../rpc/appmap/sequenceDiagram';
import { explainHandler, explainStatusHandler } from '../../rpc/explain/explain';
import RPCServer from './rpcServer';
import appmapData from '../../rpc/appmap/data';
import appmapStats from '../../rpc/appmap/stats';
import LocalNavie from '../../rpc/explain/navie/navie-local';
import RemoteNavie from '../../rpc/explain/navie/navie-remote';
import { Context, ProjectInfo } from '@appland/navie';
import { InteractionEvent } from '@appland/navie/dist/interaction-history';
import { configureRpcDirectories } from '../../lib/handleWorkingDirectory';

const AI_KEY_ENV_VARS = ['OPENAI_API_KEY'];

export const command = 'rpc';
export const describe = 'Run AppMap JSON-RPC server';

export const builder = (args: yargs.Argv) => {
  args.showHidden();

  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
    multiple: true,
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

  const directories = Array.isArray(argv.directory) ? argv.directory : [argv.directory];
  const { port, logNavie } = argv;

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
    threadId: string | undefined,
    contextProvider: Context.ContextProvider,
    projectInfoProvider: ProjectInfo.ProjectInfoProvider
  ) => {
    const navie = new LocalNavie(threadId, contextProvider, projectInfoProvider);

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
  const buildRemoteNavie = (
    threadId: string | undefined,
    contextProvider: Context.ContextProvider,
    projectInfoProvider: ProjectInfo.ProjectInfoProvider
  ) => new RemoteNavie(threadId, contextProvider, projectInfoProvider);

  const navieProvider = useLocalNavie() ? buildLocalNavie : buildRemoteNavie;

  configureRpcDirectories(directories);

  const rpcMethods: RpcHandler<any, any>[] = [
    search(),
    appmapStats(),
    appmapFilter(),
    appmapData(),
    metadata(),
    sequenceDiagram(),
    explainHandler(navieProvider),
    explainStatusHandler(),
  ];
  const rpcServer = new RPCServer(port, rpcMethods);
  rpcServer.start();
};
