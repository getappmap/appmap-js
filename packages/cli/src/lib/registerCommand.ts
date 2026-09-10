import type yargs from 'yargs';

// A command module: what yargs's CommandModule describes, with the handler's
// argument type tied to the options the builder declares.
export type Command<U> = {
  command: string;
  describe: string | false;
  aliases?: string[];
  // `{}` is yargs's own type for the arguments of a parser with no options declared.
  // eslint-disable-next-line @typescript-eslint/ban-types
  builder: yargs.BuilderCallback<{}, U>;
  handler: (args: yargs.ArgumentsCamelCase<U>) => void | Promise<void>;
};

// Register a command module with yargs.
//
// yargs's own `command(module)` types the module as CommandModule<T, any>,
// which drops the link between the builder and the handler. Its
// `command(name, describe, builder, handler)` form keeps it: the handler's
// argument type is inferred from the builder, so a handler whose arguments do
// not match the options its builder declares fails to type-check.
export default function registerCommand<U>(parser: yargs.Argv, module: Command<U>): yargs.Argv {
  const { command, describe, aliases, builder, handler } = module;
  const names = aliases ? [command, ...aliases] : command;
  if (describe === false) return parser.command(names, false, builder, handler);
  return parser.command(names, describe, builder, handler);
}
