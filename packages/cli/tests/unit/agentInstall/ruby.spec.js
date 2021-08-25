/* eslint-disable no-restricted-syntax */
const { join } = require('path');
const tmp = require('tmp');
const fs = require('fs-extra');

const {
  RubyAgentInstaller,
  BundleInstaller,
} = require('../../../src/cmds/agentInstaller/rubyAgentInstaller');

tmp.setGracefulCleanup();

const fixtureDir = join(__dirname, '..', 'fixtures', 'ruby');

const installerForProject = (projectType, cmdRunner = null) => {
  const projectFixtures = join(fixtureDir, projectType);
  const projectDir = tmp.dirSync().name;

  fs.copySync(projectFixtures, projectDir);

  const agentInstaller = new RubyAgentInstaller(projectDir, cmdRunner);
  return agentInstaller;
};

const buildToolInstaller = (installer) =>
  installer.installAgentFlow.buildToolInstaller;

describe('Ruby Agent Installation', () => {
  describe('bundler support', () => {
    it('detects bundler project', async () => {
      const installer = installerForProject('app');
      const btInstaller = buildToolInstaller(installer);
      expect(btInstaller).toBeInstanceOf(BundleInstaller);
    });

    it('provides the correct verify command', async () => {
      const btInstaller = buildToolInstaller(installerForProject('app'));
      const cmdStruct = btInstaller.verifyCommand;
      expect(cmdStruct.program).toBe('bundle');
      expect(cmdStruct.args).toEqual(['install']);
    });

    it('provides the correct init command', async () => {
      const btInstaller = buildToolInstaller(installerForProject('app'));
      const cmdStruct = btInstaller.agentInitCommand;
      expect(cmdStruct.program).toBe('bundle');
      expect(cmdStruct.args).toEqual(['exec', 'appmap-agent-init']);
    });

    describe('when validating', () => {
      it('uses the correct command', async () => {
        const btInstaller = buildToolInstaller(installerForProject('app'));
        const cmdStruct = btInstaller.agentValidateCommand;
        expect(cmdStruct.program).toBe('bundle');
        expect(cmdStruct.args).toEqual(['exec', 'appmap-agent-validate']);
      });

      it('has one step in the validating flow', async () => {
        const installer = installerForProject('app');
        expect(installer.validateAgentFlow.steps.length).toEqual(1);
      });

      it('succeeds when the agent validates the project', async () => {
        const runner = {
          runSync: () => '[]',
          logger: {
            log: () => {},
          },
        };
        const prompter = () => Promise.resolve('');

        const installer = installerForProject('app', runner);
        await expect(
          installer.validateAgentFlow.steps[0].run(prompter)
        ).resolves.toBe(0);
      });

      it('fails when the the agent detects a problem', async () => {
        const runner = {
          runSync: () =>
            '[{ "level": "error", "message": "validation failed" }]',
          logger: {
            log: () => {},
            error: () => {},
          },
        };
        const prompter = () => Promise.resolve('');
        const installer = installerForProject('app', runner);

        await expect(
          installer.validateAgentFlow.steps[0].run(prompter)
        ).rejects.toThrow(/Validation failed/);
      });
    });
  });
});
