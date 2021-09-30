import { randomBytes } from 'crypto';
import { run } from '../../../src/cmds/agentInstaller/commandRunner';
import CommandStruct from '../../../src/cmds/agentInstaller/commandStruct';

describe('CommandRunner', () => {
  describe('run', () => {
    it('raises an error when a command is not found', async () => {
      const unknownCmd = randomBytes(8).toString('hex');
      await expect(async () => {
        await run(new CommandStruct(unknownCmd, [], process.cwd()));
      }).rejects.toThrow(`${unknownCmd} was not found`);
    });
  });
});
