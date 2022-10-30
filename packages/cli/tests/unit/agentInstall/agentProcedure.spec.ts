import AgentProcedure from '../../../src/cmds/agentInstaller/agentProcedure';
import { TestAgentProcedure } from './TestAgentProcedure';

jest.mock('../../../src/cmds/userInteraction');

const procedure = new TestAgentProcedure();

describe(AgentProcedure, () => {
  describe('validateProject', () => {
    it('works correctly even if there are no errors', () => {
      jest.spyOn(procedure, 'validateAgent').mockResolvedValue({ stderr: '', stdout: `{
        "filename": "appmap.yml",
        "configuration": {
          "contents": "name: js-project\\npackages: []\\n"
        }
      }`});
      return expect(procedure.validateProject(false)).resolves.not.toThrow();
    });

    it('does not fail if there are only warnings', () => {
      jest.spyOn(procedure, 'validateAgent').mockResolvedValue({ stderr: '', stdout: `{
        "errors": [{
          "level": "warning",
          "message": "test warning"
        }]
      }`});
      return expect(procedure.validateProject(false)).resolves.not.toThrow();
    });
  });

  beforeEach(jest.restoreAllMocks);
});
