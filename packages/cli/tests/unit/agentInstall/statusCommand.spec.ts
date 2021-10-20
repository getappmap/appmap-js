import path from "path";
import tmp from 'tmp';
import yargs from "yargs";
import sinon, { stubInterface } from 'ts-sinon';
import 'jest-sinon';
import AgentInstaller from '../../../src/cmds/agentInstaller/agentInstaller';
import AgentStatusProcedure from '../../../src/cmds/agentInstaller/agentStatusProcedure';

import UI from '../../../src/cmds/userInteraction';

tmp.setGracefulCleanup();

const invokeCommand = (
  projectDir: string,
  evalResults: (err: Error | undefined, argv: any, output: string) => void,
  ) => {
  sinon.stub(console, 'log');
  sinon.stub(console, 'warn');
  sinon.stub(console, 'error');
  return yargs
    .command(require('../../../src/cmds/agentInstaller/status').default)
    .parse(
      `status ${projectDir}`,
      {},
      (err, argv, output) => {
        evalResults(err, argv, output);
      }
    );
};

describe('status sub-command', () => {
  let projectDir: string;
  let getInstallersForProject, chooseInstaller, verifyProject, validateProject, success;
  beforeEach(() => {
    projectDir = tmp.dirSync({} as any).name;
    sinon.stub(AgentStatusProcedure.prototype, 'getEnvironmentForDisplay').resolves(['env']);

    const installer = stubInterface<AgentInstaller>();
    installer.verifyCommand = undefined;

    getInstallersForProject = sinon.stub(AgentStatusProcedure.prototype, 'getInstallersForProject').resolves([installer]);

    chooseInstaller = sinon.stub(AgentStatusProcedure.prototype, 'chooseInstaller');
    verifyProject = sinon.stub(AgentStatusProcedure.prototype, 'verifyProject');
    validateProject = sinon.stub(AgentStatusProcedure.prototype, 'validateProject');
    success = sinon.stub(UI, 'success')
  });

  afterEach(() => {
    sinon.restore();
  });

  it('works', async () => {
    const evalResults = (err, argv, output) => {
      expect(err).toBeNull;
    }

    await invokeCommand(projectDir, evalResults);
    
    expect(chooseInstaller).not.toBeCalled();
    expect(verifyProject).toBeCalledOnce();
    expect(validateProject).toBeCalledOnce();
    expect(success).toBeCalledWithExactly('Success!');
  });

  it('chooses an installer when there are multiple options', async () => {
    const installers: Array<AgentInstaller> = [];
    installers[0] = stubInterface<AgentInstaller>();
    installers[1] = stubInterface<AgentInstaller>();

    getInstallersForProject.restore();    
    getInstallersForProject = sinon.stub(AgentStatusProcedure.prototype, 'getInstallersForProject').resolves(installers);

    chooseInstaller.resolves(installers[0]);

    const evalResults = (err, argv, output) => {
      expect(err).toBeNull;
    }

    await invokeCommand(projectDir, evalResults);
    expect(chooseInstaller).toBeCalledOnce();
  });
  
  it('fails when project verification fails', async () => {
    const error = new Error('verification failed');
    verifyProject.throws(error);
    const evalResults = (err, argv, output) => {
      expect(err).toBe(error);
    };

    await invokeCommand(projectDir, evalResults);
  });

  it('fails when project validation fails', async () => {
    const error = new Error('validation failed');
    validateProject.throws(error);
    const evalResults = (err, argv, output) => {
      expect(err).toBe(error);
    };

    await invokeCommand(projectDir, evalResults);

    expect(verifyProject).toBeCalledOnce();
  });
});
