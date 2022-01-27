import { randomBytes } from 'crypto';
import { run, runSync } from '../../../src/cmds/agentInstaller/commandRunner';
import CommandStruct from '../../../src/cmds/agentInstaller/commandStruct';

describe('CommandRunner', () => {
  describe('run', () => {
    it('raises an error when a command is not found', async () => {
      const unknownCmd = randomBytes(8).toString('hex');
      const errorRegexp = new RegExp(
        `${unknownCmd}.*(not (found|recognized)|exited with code.*127)`,
        's'
      );
      await expect(async () => {
        await run(new CommandStruct(unknownCmd, [], process.cwd()));
      }).rejects.toThrow(errorRegexp);
    });

    it('run succeeds if an arg contains spaces', async () => {
      const hw = 'Hello world!';
      const cmd = new CommandStruct('node', ['-p', `'${hw}'`], process.cwd());
      const { stdout } = await run(cmd);
      expect(stdout).toStrictEqual(`${hw}\n`);
    });

    it('runSync success if an arg contains spaces', async () => {
      const hw = 'Hello world!';
      const cmd = new CommandStruct('node', ['-p', `'${hw}'`], process.cwd());
      const output = runSync(cmd);
      expect(output).toStrictEqual(`${hw}\n`);
    });

    it('raises an error if an arg has embedded quotes', async () => {
      expect(() => {
        new CommandStruct('node', ['-p', '"Hello world!"'], process.cwd());
      }).toThrow("Don't embed quotes in args");
    });
  });
});
