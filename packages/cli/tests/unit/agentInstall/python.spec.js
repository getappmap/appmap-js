/* eslint-disable no-restricted-syntax */
const { join } = require('path');
const tmp = require('tmp');
const fs = require('fs-extra');

const {
  PythonAgentInstaller,
  PoetryInstaller,
  PipInstaller,
} = require('../../../src/cmds/agentInstaller/pythonAgentInstaller');

tmp.setGracefulCleanup();

const fixtureDir = join(__dirname, '..', 'fixtures', 'python');

const installerForProject = (projectType) => {
  const projectFixtures = join(fixtureDir, projectType);
  const projectDir = tmp.dirSync().name;

  fs.copySync(projectFixtures, projectDir);

  const agentInstaller = new PythonAgentInstaller(projectDir);
  return agentInstaller;
};

const buildToolInstaller = (installer) =>
  installer.installAgent()[0].buildToolInstaller;

describe('Agent Installation', () => {
  describe('poetry support', () => {
    it('detects poetry project', async () => {
      const installer = installerForProject('poetry');
      const btInstaller = buildToolInstaller(installer);
      expect(btInstaller).toBeInstanceOf(PoetryInstaller);
    });

    it('provides the correct verify command', async () => {
      const btInstaller = buildToolInstaller(installerForProject('poetry'));
      const cmdStruct = btInstaller.verifyCommand;
      expect(cmdStruct.program).toBe('poetry');
      expect(cmdStruct.args).toEqual([
        'add',
        '--dev',
        '--allow-prereleases',
        'appmap',
      ]);
    });
  });

  describe('pip support', () => {
    it('detects pip project', async () => {
      const installer = installerForProject('pip');
      expect(buildToolInstaller(installer)).toBeInstanceOf(PipInstaller);
    });

    it('provides the correct verify command', async () => {
      const btInstaller = buildToolInstaller(installerForProject('pip'));
      const cmdStruct = btInstaller.verifyCommand;
      expect(cmdStruct.program).toBe('pip');
      expect(cmdStruct.args).toEqual(['install', '-r', 'requirements.txt']);
    });

    it('adds appmap to requirements.txt when missing', async () => {
      const installer = installerForProject('pip');
      const btInstaller = buildToolInstaller(installer);
      const status = await btInstaller.install();
      expect(status).toBe('installed');

      const requirementsTxt = fs.readFileSync(
        join(installer.path, 'requirements.txt'),
        'utf8'
      );
      expect(requirementsTxt).toMatch(/^appmap>=/);
    });

    it('replaces existing appmap in requirements.txt', async () => {
      const installer = installerForProject('pip');
      const btInstaller = buildToolInstaller(installer);
      const requirementsPath = join(installer.path, 'requirements.txt');
      fs.writeFileSync(requirementsPath, ' appmap == 1.0.0');

      const status = await btInstaller.install();
      expect(status).toBe('installed');

      const requirementsTxt = fs.readFileSync(
        join(installer.path, 'requirements.txt'),
        'utf8'
      );
      expect(requirementsTxt).toMatch(/^appmap>=/);
    });

    it("doesn't munge a non-matching requirement", async () => {
      const installer = installerForProject('pip');
      const btInstaller = buildToolInstaller(installer);
      const requirementsPath = join(installer.path, 'requirements.txt');
      fs.writeFileSync(requirementsPath, ' not-appmap == 1.0.0');

      const status = await btInstaller.install();
      expect(status).toBe('installed');

      const requirementsTxt = fs.readFileSync(
        join(installer.path, 'requirements.txt'),
        'utf8'
      );
      expect(requirementsTxt).toMatch(/^appmap>=/m);
      expect(requirementsTxt).toMatch(/^ not-appmap == 1.0.0/m);
    });
  });
});
