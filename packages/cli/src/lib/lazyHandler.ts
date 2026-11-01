// Wrap a command handler so that the module implementing it is loaded only
// when yargs dispatches to the command.
//
// cli.ts registers every command at startup, and `appmap <command> --help`
// runs the command's builder, so command modules must stay cheap to import.
// The handler is where the heavy dependencies live: the Navie and RPC
// commands alone pull in mermaid, jsdom, langchain and express, and a command
// like `sanitize` should not pay for any of that.
//
// The handler module exports the handler as its default export. Its argument
// type flows through to the wrapper, so the command module's `handler` keeps
// the signature of the function that implements it. yargs ignores what a
// handler returns, so the wrapper returns nothing; code that wants the result
// calls the handler module directly.
export default function lazyHandler<A>(
  load: () => Promise<{ default: (argv: A) => unknown }>
): (argv: A) => Promise<void> {
  return async (argv) => {
    const { default: handler } = await load();
    await handler(argv);
  };
}
