/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import yargs from 'yargs';
import chalk from 'chalk';
import { ContextV2, Help, ProjectInfo, Agents } from '@appland/navie';
import { loadConfiguration } from '@appland/client';

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
import { appmapStatsV1, appmapStatsV2 } from '../../rpc/appmap/stats';
import LocalNavie from '../../rpc/explain/navie/navie-local';
import RemoteNavie from '../../rpc/explain/navie/navie-remote';
import { InteractionEvent } from '@appland/navie/dist/interaction-history';
import { configureRpcDirectories } from '../../lib/handleWorkingDirectory';
import {
  getConfigurationV1,
  getConfigurationV2,
  setConfigurationV1,
  setConfigurationV2,
} from '../../rpc/configuration';
import detectCodeEditor from '../../lib/detectCodeEditor';

const AI_KEY_ENV_VARS = ['OPENAI_API_KEY', 'AZURE_OPENAI_API_KEY'];

export const command = 'rpc';
export const describe = 'Run AppMap JSON-RPC server';

export const builder = (args: yargs.Argv) => {
  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
    array: true,
  });
  args.option('port', {
    describe:
      'port to listen on for JSON-RPC requests. Use port 0 to let the OS choose a port. The port number will be printed to stdout on startup.',
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
  args.option('ai-option', {
    describe:
      'Specify an extended option to the AI provider, in the form of a key=value pair. May be repeated.',
    type: 'string',
    array: true,
  });

  args.option('agent-mode', {
    describe: `Agent mode which to run the Navie AI. The agent can also be controlled by starting the question with '@<agent> '.`,
    choices: Object.values(Agents).map((agent) => agent.toLowerCase()),
  });

  args.option('code-editor', {
    describe:
      'Active code editor. This information is used to tune the @help responses. If unspecified, the code editor may be picked up from environment variables such as TERM_PROGRAM and TERMINAL_EMULATOR.',
    type: 'string',
    // Allow this to be any string. The code editor brand name may be a clue to the language
    // in use, or the user's intent.
  });

  return args.strict();
};

export const handler = async (argv) => {
  verbose(argv.verbose);

  const directories: string[] = [];
  if (argv.directory) {
    Array.isArray(argv.directory)
      ? directories.push(...argv.directory)
      : directories.push(argv.directory);
  }

  const { port, logNavie } = argv;
  let aiOptions: string[] | undefined = argv.aiOption;
  if (aiOptions) {
    aiOptions = Array.isArray(aiOptions) ? aiOptions : [aiOptions];
  }
  const agentModeStr: string | undefined = argv.explainMode;
  let agentMode: Agents | undefined;
  if (agentModeStr) agentMode = agentModeStr as Agents;

  let codeEditor: string | undefined = argv.codeEditor;
  if (!codeEditor) {
    codeEditor = detectCodeEditor();
    if (codeEditor) log(`Detected code editor: ${codeEditor}`);
  }

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

  const applyAIOptions = (navie: LocalNavie | RemoteNavie) => {
    if (aiOptions) {
      for (const option of aiOptions) {
        const [key, value] = option.split('=');
        if (key && value) {
          navie.setOption(key, value);
        }
      }
    }
    if (agentMode) {
      navie.setOption('explainMode', agentMode);
    }
  };

  const buildLocalNavie = (
    threadId: string | undefined,
    contextProvider: ContextV2.ContextProvider,
    projectInfoProvider: ProjectInfo.ProjectInfoProvider,
    helpProvider: Help.HelpProvider
  ) => {
    const navie = new LocalNavie(threadId, contextProvider, projectInfoProvider, helpProvider);
    applyAIOptions(navie);

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
    contextProvider: ContextV2.ContextProvider,
    projectInfoProvider: ProjectInfo.ProjectInfoProvider,
    helpProvider: Help.HelpProvider
  ) => {
    loadConfiguration(false);
    const navie = new RemoteNavie(threadId, contextProvider, projectInfoProvider, helpProvider);
    applyAIOptions(navie);
    return navie;
  };

  const navieProvider = useLocalNavie() ? buildLocalNavie : buildRemoteNavie;

  configureRpcDirectories(directories);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rpcMethods: RpcHandler<any, any>[] = [
    search(),
    appmapStatsV1(),
    appmapStatsV2(),
    appmapFilter(),
    appmapData(),
    metadata(),
    sequenceDiagram(),
    explainHandler(navieProvider, codeEditor),
    explainStatusHandler(),
    setConfigurationV1(),
    getConfigurationV1(),
    setConfigurationV2(),
    getConfigurationV2(),
  ];
  const rpcServer = new RPCServer(port, rpcMethods);
  rpcServer.start();
};
