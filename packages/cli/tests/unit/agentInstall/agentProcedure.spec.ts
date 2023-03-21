import AgentProcedure from '../../../src/cmds/agentInstaller/agentProcedure';
import { TestAgentProcedure } from './TestAgentProcedure';
import UI from '../../../src/cmds/userInteraction';
import sinon, { SinonStub } from 'sinon';
import { withStubbedTelemetry } from '../../helper';
import InstallerUI from '../../../src/cmds/agentInstaller/installerUI';

jest.mock('../../../src/cmds/userInteraction');

const procedure = new TestAgentProcedure();
const interactiveUI = new InstallerUI(true, {});

const { prompt } = jest.mocked(UI);

describe(AgentProcedure, () => {
  withStubbedTelemetry(sinon);
  describe('validateProject', () => {
    it('works correctly even if there are no errors', () => {
      jest.spyOn(procedure, 'validateAgent').mockResolvedValue({
        stderr: '',
        stdout: `{
        "filename": "appmap.yml",
        "configuration": {
          "contents": "name: js-project\\npackages: []\\n"
        }
      }`,
      });
      return expect(procedure.validateProject(interactiveUI, false)).resolves.not.toThrow();
    });

    it('does not fail if there are only warnings', () => {
      jest.spyOn(procedure, 'validateAgent').mockResolvedValue({
        stderr: '',
        stdout: `{
        "errors": [{
          "level": "warning",
          "message": "test warning"
        }]
      }`,
      });
      return expect(procedure.validateProject(interactiveUI, false)).resolves.not.toThrow();
    });

    it('fails if there are errors', () => {
      jest.spyOn(procedure, 'validateAgent').mockResolvedValue({
        stderr: '',
        stdout: `{
        "errors": [{
          "level": "error",
          "message": "test error"
        }]
      }`,
      });
      return expect(procedure.validateProject(interactiveUI, false)).rejects.toThrowError(
        /test error/
      );
    });
  });

  beforeEach(jest.restoreAllMocks);
});

describe(AgentProcedure, () => {
  withStubbedTelemetry(sinon);
  describe('commitConfiguration', () => {
    const filesAfter = [
      {
        file: 'Gemfile',
        status: ' M',
      },
      {
        file: 'Gemfile.lock',
        status: ' M',
      },
      {
        file: 'appmap.yml',
        status: '??',
      },
    ];

    describe('does not commit', () => {
      it('there is no diff', () => {
        const filesBefore = [];
        const filesAfter = [];
        jest.spyOn(procedure, 'gitStatus').mockResolvedValue(filesAfter);
        return expect(procedure.commitConfiguration(interactiveUI, filesBefore)).resolves.toBe(
          false
        );
      });

      it('there is a diff and user selected to not commit', () => {
        const filesBefore = [];
        jest.spyOn(procedure, 'gitStatus').mockResolvedValue(filesAfter);
        prompt.mockResolvedValue({ commit: false });
        return expect(procedure.commitConfiguration(interactiveUI, filesBefore)).resolves.toBe(
          false
        );
      });
    });

    describe('commits', () => {
      it('there is a diff and user selected to commit', () => {
        const filesBefore = [];
        jest.spyOn(procedure, 'gitStatus').mockResolvedValue(filesAfter);
        prompt.mockResolvedValue({ commit: true });
        jest.spyOn(procedure, 'gitCommit').mockResolvedValue({
          success: true,
          errorMessage: '',
        });
        return expect(procedure.commitConfiguration(interactiveUI, filesBefore)).resolves.toBe(
          true
        );
      });
    });
  });

  beforeEach(jest.restoreAllMocks);
});
