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

const installerForProject = (projectType) => {
  const projectFixtures = join(fixtureDir, projectType);
  const projectDir = tmp.dirSync().name;

  fs.copySync(projectFixtures, projectDir);

  const agentInstaller = new RubyAgentInstaller(projectDir);
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
  });
});
