import { warn } from 'node:console';
import { createWriteStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import type { Writable } from 'node:stream';
import { text } from 'node:stream/consumers';

import chalk from 'chalk';
import yargs from 'yargs';

import { loadConfiguration } from '@appland/client';
import { Agents, ContextV2, Help, ProjectInfo } from '@appland/navie';
import { InteractionEvent } from '@appland/navie/dist/interaction-history';

import { configureRpcDirectories } from '../lib/handleWorkingDirectory';
import { explainHandler } from '../rpc/explain/explain';
import INavie, { INavieProvider } from '../rpc/explain/navie/inavie';
import LocalNavie from '../rpc/explain/navie/navie-local';
import RemoteNavie from '../rpc/explain/navie/navie-remote';
import detectAIEnvVar, { AI_KEY_ENV_VARS } from './index/aiEnvVar';

interface ExplainArgs {
  aiOption?: string[];
  agentMode?: Agents;
  navieProvider?: string;
  logNavie?: boolean;
}

interface NavieCommonCmdArgs extends ExplainArgs {
  codeEditor?: string;
  directory: string[];
}

export function commonNavieArgsBuilder<T>(args: yargs.Argv<T>): yargs.Argv<T & NavieCommonCmdArgs> {
  return args
    .option('directory', {
      describe: 'program working directory',
      type: 'string',
      alias: 'd',
      array: true,
      nargs: 1, // this is so that it doesn't slurp all positionals
      default: [process.cwd()],
    })
    .option('navie-provider', {
      describe: 'navie provider to use',
      type: 'string',
      choices: ['local', 'remote'],
    })
    .option('log-navie', {
      describe: 'Log Navie events to stderr',
      boolean: true,
      default: false,
    })
    .option('ai-option', {
      describe:
        'Specify an extended option to the AI provider, in the form of a key=value pair. May be repeated.',
      type: 'string',
      array: true,
    })
    .option('agent-mode', {
      describe: `Agent mode which to run the Navie AI. The agent can also be controlled by starting the question with '@<agent> '.`,
      choices: Object.values(Agents).map((agent) => agent.toLowerCase()),
    })
    .option('code-editor', {
      describe:
        'Active code editor. This information is used to tune the @help responses. If unspecified, the code editor may be picked up from environment variables APPMAP_CODE_EDITOR, TERM_PROGRAM and TERMINAL_EMULATOR.',
      type: 'string',
      // Allow this to be any string. The code editor brand name may be a clue to the language
      // in use, or the user's intent.
    });
}

export function buildNavieProvider(argv: ExplainArgs) {
  const { logNavie } = argv;
  let aiOptions: string[] | undefined = argv.aiOption;
  if (aiOptions) {
    aiOptions = Array.isArray(aiOptions) ? aiOptions : [aiOptions];
  }
  const agentModeStr: string | undefined = argv.agentMode;
  let agentMode: Agents | undefined;
  if (agentModeStr) agentMode = agentModeStr as Agents;

  const useLocalNavie = () => {
    if (argv.navieProvider === 'local') {
      warn(`Using local Navie provider due to explicit --navie-provider=local option`);
      return true;
    }

    if (argv.navieProvider === 'remote') {
      warn(`Using remote Navie provider due to explicit --navie-provider=remote option`);
      return false;
    }

    const aiEnvVar = detectAIEnvVar();
    if (aiEnvVar) {
      warn(`Using local Navie provider due to presence of environment variable ${aiEnvVar}`);
      return true;
    }

    warn(
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
    loadConfiguration(false);
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
    loadConfiguration(true);
    const navie = new RemoteNavie(threadId, contextProvider, projectInfoProvider, helpProvider);
    applyAIOptions(navie);
    return navie;
  };

  return useLocalNavie() ? buildLocalNavie : buildRemoteNavie;
}

export const command = 'navie [question..]';
export const describe = 'Explain a question using Navie';

export function builder<T>(args: yargs.Argv<T>) {
  return commonNavieArgsBuilder(args)
    .positional('question', {
      describe: 'Question text; appended to any other input',
      type: 'string',
      array: true,
    })
    .option('output', {
      describe: 'Output path',
      type: 'string',
      alias: 'o',
    })
    .option('input', {
      describe: 'Input path',
      type: 'string',
      alias: 'i',
    });
}

type HandlerArguments = yargs.ArgumentsCamelCase<
  ReturnType<typeof builder> extends yargs.Argv<infer A> ? A : never
>;

export async function handler(argv: HandlerArguments) {
  await configureRpcDirectories(argv.directory);

  const output = openOutput(argv.output);

  function attachNavie(navie: INavie) {
    return navie
      .on('error', (err) => {
        warn(err);
        process.exitCode = 1;
      })
      .on('token', (token) => output.write(token));
  }

  const question = await getQuestion(argv.input, argv.question);
  const capturingProvider = (...args: Parameters<INavieProvider>) =>
    attachNavie(buildNavieProvider(argv)(...args));
  await explainHandler(capturingProvider, argv.codeEditor).handler({ question });
}

function openOutput(outputPath: string | undefined): Writable {
  switch (outputPath) {
    case '-':
    case undefined:
      // prevent other things from messing with the output
      console.log = console.debug = console.warn;

      warn('No output specified, writing to stdout');
      return process.stdout;
    default:
      warn(`Writing output to ${outputPath}`);
      return createWriteStream(outputPath);
  }
}

async function getQuestion(path?: string, literal?: string[]): Promise<string> {
  const question = [...(literal ?? [])];
  const targetPath = path ?? (question.length ? undefined : '-');

  if (targetPath === '-') {
    warn('Reading question from stdin');
    question.unshift(await text(process.stdin));
  } else if (targetPath) {
    warn(`Reading question from ${targetPath}`);
    question.unshift(await readFile(targetPath, 'utf-8'));
  }

  return question.join(' ');
}