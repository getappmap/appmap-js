import { format } from 'util';
import * as commandRunner from '../../../src/cmds/agentInstaller/commandRunner';
import CommandStruct, { CommandReturn } from '../../../src/cmds/agentInstaller/commandStruct';
import { ChildProcessError } from '../../../src/cmds/errors';

type MockCommand = [
  (cmd: CommandStruct) => boolean,
  (cmd: CommandStruct) => Promise<CommandReturn>
];
let mocks: MockCommand[] = [];

function spyIfNeeded() {
  if (jest.isMockFunction(commandRunner.run)) return;
  mocks = []; // drop any mocks from the previous run
  jest.spyOn(commandRunner, 'run').mockImplementation((command) => {
    for (const [pred, fn] of mocks) {
      if (pred(command)) return fn(command);
    }
    throw new Error(format('unexpected command %o', command));
  });
}

function matchCmd(cmd: string) {
  const [program, ...args] = cmd.split(' ');
  return (cmd: CommandStruct) => {
    return cmd.program === program && cmd.args.join(' ') === args.join(' ');
  };
}

export default function mockCommand(cmd: string) {
  spyIfNeeded();
  const match = matchCmd(cmd);
  return {
    toError: (output: string, code: number) =>
      mocks.push([
        match,
        async (cmdStruct) => {
          throw new ChildProcessError(cmdStruct.toString(), output, code);
        },
      ]),
  };
}
