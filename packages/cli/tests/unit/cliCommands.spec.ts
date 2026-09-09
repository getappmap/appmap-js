import 'reflect-metadata';

import commands from '../../src/cliCommands';
import { commandModule } from '../../src/lib/lazyCommand';

// cli.ts registers each subcommand from the name, description and aliases in
// cliCommands.ts and loads the implementing module only on dispatch. yargs
// therefore never sees the module's own values, so they must agree.
describe('CLI command registry', () => {
  it('declares every command the way its module does', () => {
    for (const spec of commands) {
      const mod = commandModule(spec.load());
      const declared = { command: spec.command, describe: spec.describe, aliases: spec.aliases };
      const actual = { command: mod.command, describe: mod.describe, aliases: mod.aliases };
      expect({ [spec.command]: actual }).toEqual({ [spec.command]: declared });
    }
  });

  it('lists each command once', () => {
    const names = commands.map((spec) => spec.command);
    expect(new Set(names).size).toEqual(names.length);
  });
});
