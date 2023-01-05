import AgentStatusProcedure from '../../../src/cmds/agentInstaller/agentStatusProcedure';

import UI from '../../../src/cmds/userInteraction';
import { TestAgentInstaller } from './TestAgentProcedure';

jest.mock('../../../src/cmds/userInteraction');
const { success, warn } = jest.mocked(UI);

const procedure = new AgentStatusProcedure(new TestAgentInstaller(), '/test/project/path');

describe(AgentStatusProcedure, () => {
  it('prints any warnings from the validator', async () => {
    jest.spyOn(procedure, 'validateProject').mockResolvedValue({
      errors: [
        {
          level: 'warning',
          message: 'Remember to foo the bar.',
          help_urls: ['test:///help/url'],
        },
      ],
    });

    await procedure.run();

    expect(success).toBeCalled();

    expect(warn).toBeCalled();
    const [message] = warn.mock.calls[0];
    expect(message).toContain('Warning: Remember to foo the bar.');
    expect(message).toContain('test:///help/url');
  });

  beforeEach(jest.restoreAllMocks);
});
