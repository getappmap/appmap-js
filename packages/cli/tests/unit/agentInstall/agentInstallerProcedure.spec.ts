import AgentInstallerProcedure from '../../../src/cmds/agentInstaller/agentInstallerProcedure';
import * as CommandRunner from '../../../src/cmds/agentInstaller/commandRunner';

import fs from 'fs';
import { TestAgentInstaller } from './TestAgentProcedure';
import UI from '../../../src/cmds/userInteraction';

jest.mock('../../../src/cmds/userInteraction');
jest.mock('../../../src/cmds/agentInstaller/commandRunner');

const { prompt, success } = jest.mocked(UI);
const { run } = jest.mocked(CommandRunner);

const procedure = new AgentInstallerProcedure(new TestAgentInstaller(), '/test/path');

describe(AgentInstallerProcedure, () => {
  it('prints any notes from the validator', async () => {
    prompt.mockResolvedValue({ confirm: true });
    jest.spyOn(procedure, 'validateProject').mockResolvedValue({ notes: ['Remember to foo the bar.'] });
    run.mockResolvedValue({ stdout: '{"configuration": {"contents": ""}}', stderr: '' });
    jest.spyOn(fs, 'writeFileSync').mockImplementation();

    await procedure.run();

    expect(success).toBeCalled();

    const [message] = success.mock.calls[0];
    expect(message).toContain('NOTE: Remember to foo the bar.');
  });

  beforeEach(jest.restoreAllMocks);
});
