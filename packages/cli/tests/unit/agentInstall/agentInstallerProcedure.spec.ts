import AgentInstallerProcedure from '../../../src/cmds/agentInstaller/agentInstallerProcedure';
import * as CommandRunner from '../../../src/cmds/agentInstaller/commandRunner';

import fs from 'fs';
import { TestAgentInstaller } from './TestAgentProcedure';
import UI from '../../../src/cmds/userInteraction';
import sinon, { SinonStub } from 'sinon';
import { withStubbedTelemetry } from '../../helper';

jest.mock('../../../src/cmds/userInteraction');
jest.mock('../../../src/cmds/agentInstaller/commandRunner');

const { prompt, success, warn } = jest.mocked(UI);
const { run } = jest.mocked(CommandRunner);

const procedure = new AgentInstallerProcedure(new TestAgentInstaller(), '/test/path');

describe(AgentInstallerProcedure, () => {
  withStubbedTelemetry(sinon);
  it('prints any warnings from the validator', async () => {
    prompt.mockResolvedValue({ confirm: true });
    jest.spyOn(procedure, 'validateProject').mockResolvedValue(
      { errors: [{ level: 'warning', message: 'Remember to foo the bar.', help_urls: ['test:///help/url'] }] }
    );
    run.mockResolvedValue({ stdout: '{"configuration": {"contents": ""}}', stderr: '' });
    jest.spyOn(fs, 'writeFileSync').mockImplementation();

    await procedure.run();

    expect(success).toBeCalled();

    expect(warn).toBeCalled();
    const [message] = warn.mock.calls[0];
    expect(message).toContain('Warning: Remember to foo the bar.');
    expect(message).toContain('test:///help/url');
  });

  beforeEach(jest.restoreAllMocks);
});
