import type { Argv, CommandModule } from 'yargs';

// What cli.ts declares for each subcommand: enough for yargs to list and match
// the command, plus a loader for the module that implements it.
export type LazyCommandSpec = {
  command: string;
  describe: string | false;
  aliases?: string[];
  load: () => unknown;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCommandModule = CommandModule<any, any>;

// A command module is exported either as `module.exports = { command, ... }`
// or as `export default { command, ... }`.
export function commandModule(loaded: unknown): AnyCommandModule {
  const { default: defaultExport } = loaded as { default?: AnyCommandModule };
  return typeof defaultExport?.handler === 'function'
    ? defaultExport
    : (loaded as AnyCommandModule);
}

// Register a command from its name and description alone, and load the module
// that implements it only when yargs dispatches to it.
//
// Loading every command module up front costs more than most commands do in
// total work: the Navie and RPC commands alone pull in mermaid, jsdom,
// langchain and express, and a command like `sanitize` paid for all of that
// before parsing its arguments.
export default function lazyCommand(spec: LazyCommandSpec): AnyCommandModule {
  const { command, describe, aliases, load } = spec;
  let loaded: AnyCommandModule | undefined;
  const implementation = () => {
    if (!loaded) loaded = commandModule(load());
    return loaded;
  };

  return {
    command,
    describe,
    aliases,
    builder: (yargs: Argv): Argv => {
      const { builder } = implementation();
      if (typeof builder === 'function') return (builder as (args: Argv) => Argv)(yargs);
      return builder ? yargs.options(builder) : yargs;
    },
    handler: (argv) => implementation().handler(argv),
  };
}
