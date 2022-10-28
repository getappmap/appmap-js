import AgentStatusProcedure from '../../../src/cmds/agentInstaller/agentStatusProcedure';

import UI from '../../../src/cmds/userInteraction';
import { TestAgentInstaller } from './TestAgentProcedure';

jest.mock('../../../src/cmds/userInteraction');
const { success } = jest.mocked(UI);

const procedure = new AgentStatusProcedure(new TestAgentInstaller(), '/test/project/path');

describe(AgentStatusProcedure, () => {
  it('prints any notes from the validator', async () => {
    jest.spyOn(procedure, 'validateProject').mockResolvedValue({ notes: ['Remember to foo the bar.'] });

    await procedure.run();

    expect(success).toBeCalled();

    const [message] = success.mock.calls[0];
    expect(message).toContain('NOTE: Remember to foo the bar.');
  });

  beforeEach(jest.restoreAllMocks);
});
