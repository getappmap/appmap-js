import AgentProcedure from '../../../src/cmds/agentInstaller/agentProcedure';
import { TestAgentProcedure } from './TestAgentProcedure';

jest.mock('../../../src/cmds/userInteraction');

describe(AgentProcedure, () => {
  describe('validateProject', () => {
    it('works correctly even if there are no errors', () => {
      const procedure = new TestAgentProcedure();
      jest.spyOn(procedure, 'validateAgent').mockResolvedValue({ stderr: '', stdout: `{
        "filename": "appmap.yml",
        "configuration": {
          "contents": "name: js-project\\npackages: []\\n"
        }
      }`});
      expect(() => procedure.validateProject(false)).not.toThrowError();
    });
  });

  beforeEach(jest.restoreAllMocks);
});
