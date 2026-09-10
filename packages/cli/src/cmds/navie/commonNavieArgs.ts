import type { Agents } from '@appland/navie';
import yargs from 'yargs';

// The options shared by the navie, rpc and rpc-client commands. This module
// is imported by the command modules at startup, so it must stay light: only
// yargs and types.

export interface ExplainArgs {
  verbose: boolean;
  aiOption?: string[];
  agentMode?: Agents;
  navieProvider?: string;
  logNavie?: boolean;
  prompt?: string;
  threadId?: string;
  trajectoryFile?: string;
}

export interface NavieCommonCmdArgs extends ExplainArgs {
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
