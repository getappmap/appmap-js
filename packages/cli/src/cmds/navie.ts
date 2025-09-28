import { warn } from 'node:console';
import { createWriteStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import type { Writable } from 'node:stream';
import { text } from 'node:stream/consumers';

import chalk from 'chalk';
import yargs from 'yargs';

import { loadConfiguration } from '@appland/client';
import { Agents, ContextV2, Help, ProjectInfo, TestInvocation } from '@appland/navie';
import { InteractionEvent } from '@appland/navie/dist/interaction-history';

import { configureRpcDirectories } from '../lib/handleWorkingDirectory';
import observePerformance from '../lib/observePerformance';
import { explainHandler } from '../rpc/explain/explain';
import INavie, { INavieProvider } from '../rpc/explain/navie/inavie';
import LocalNavie from '../rpc/explain/navie/navie-local';
import detectCodeEditor from '../lib/detectCodeEditor';
import { verbose } from '../utils';
import Trajectory from '../rpc/explain/navie/trajectory';
import { serveAndOpenNavie } from '../lib/serveAndOpen';
import RPCServer from './index/rpcServer';
import { rpcMethods } from './index/rpc';
import NopNavie from '../rpc/explain/navie/navie-nop';

interface ExplainArgs {
  verbose: boolean;
  aiOption?: string[];
  agentMode?: Agents;
  navieProvider?: string;
  logNavie?: boolean;
  prompt?: string;
  threadId?: string;
  trajectoryFile?: string;
}

interface NavieCommonCmdArgs extends ExplainArgs {
  codeEditor?: string;
  directory: string[];
}

export function commonNavieArgsBuilder<T>(args: yargs.Argv<T>): yargs.Argv<T & NavieCommonCmdArgs> {
  return args
    .option('verbose', {
      describe: 'Verbose output',
      boolean: true,
      default: false,
    })
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
      deprecated: "only local provider is supported",
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
      describe: `This option is deprecated. Instead, start your question with @<command | agent>.`,
    })
    .option('prompt', {
      describe: 'A file containing custom system prompts to send to the LLM',
      alias: 'p',
      type: 'string',
    })
    .option('code-editor', {
      describe:
        'Active code editor. This information is used to tune the @help responses. If unspecified, the code editor may be picked up from environment variables APPMAP_CODE_EDITOR, TERM_PROGRAM and TERMINAL_EMULATOR.',
      type: 'string',
      // Allow this to be any string. The code editor brand name may be a clue to the language
      // in use, or the user's intent.
    })
    .option('thread-id', {
      describe:
        'The thread ID to use for the question. If not provided, a new thread ID will be allocated. Valid only for local Navie provider.',
      type: 'string',
    })
    .option('trajectory-file', {
      describe: 'File to write the LLM interaction history, in JSONL format',
      type: 'string',
    })
    .option('ui', {
      describe: 'Open Navie UI in the browser',
      boolean: true,
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

  const applyAIOptions = (navie: LocalNavie | NopNavie) => {
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
    contextProvider: ContextV2.ContextProvider,
    projectInfoProvider: ProjectInfo.ProjectInfoProvider,
    helpProvider: Help.HelpProvider,
    testInvocationProvider: TestInvocation.TestInvocationProvider
  ) => {
    loadConfiguration(false);
    const navie = new LocalNavie(contextProvider, projectInfoProvider, helpProvider, testInvocationProvider);

    if (argv.threadId) navie.setThreadId(argv.threadId);
    if (argv.trajectoryFile) {
      const trajectory = new Trajectory(argv.trajectoryFile);
      navie.setTrajectoryHandler(trajectory);

      process.on('exit', () => trajectory.close());
    }
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

  return buildLocalNavie;
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
    })
    .option('code-selection', {
      describe: 'Code selection path',
      type: 'string',
      alias: 'c',
    });
}

type HandlerArguments = yargs.ArgumentsCamelCase<
  ReturnType<typeof builder> extends yargs.Argv<infer A> ? A : never
>;

export async function handler(argv: HandlerArguments) {
  if (argv.navieProvider) warn(`--navie-provider option is no longer supported`);

  observePerformance();
  verbose(argv.verbose);
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

  let codeEditor: string | undefined = argv.codeEditor;
  if (!codeEditor) {
    codeEditor = detectCodeEditor();
    if (codeEditor) warn(`Detected code editor: ${codeEditor}`);
  }

  const capturingProvider = (...args: Parameters<INavieProvider>) =>
    attachNavie(buildNavieProvider(argv)(...args));

  // WIP: Help the @apply command to resolve paths
  if (argv.directory.length === 1) process.chdir(argv.directory[0]);

  const openInTerminal = async () => {
    let codeSelection: string | undefined;
    if (argv.codeSelection) codeSelection = await readFile(argv.codeSelection, 'utf-8');

    let prompt: string | undefined;
    if (argv.prompt) prompt = await readFile(argv.prompt, 'utf-8');

    const question = await getQuestion(argv.input, argv.question);

    return await explainHandler(capturingProvider, codeEditor).handler({
      question,
      codeSelection,
      prompt,
    });
  };

  const openInBrowser = (): void => {
    const rpcServer = new RPCServer(0, rpcMethods(buildNavieProvider(argv), codeEditor));
    rpcServer.start((port) => {
      serveAndOpenNavie(port);
    });
  };

  if (argv.ui) {
    openInBrowser();
  } else {
    await openInTerminal();
  }
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
    question.push(await text(process.stdin));
  } else if (targetPath) {
    warn(`Reading question from ${targetPath}`);
    question.push(await readFile(targetPath, 'utf-8'));
  }

  return question.join(' ');
}
