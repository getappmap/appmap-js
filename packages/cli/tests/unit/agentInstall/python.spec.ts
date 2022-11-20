/* eslint-disable no-restricted-syntax */
import fs from 'fs-extra';
import { join } from 'path';
import sinon from 'sinon';
import tmp from 'tmp';
import * as commandRunner from '../../../src/cmds/agentInstaller/commandRunner';
import {
  PipenvInstaller,
  PipInstaller,
  PoetryInstaller,
} from '../../../src/cmds/agentInstaller/pythonAgentInstaller';

tmp.setGracefulCleanup();

const fixtureDir = join(__dirname, '..', 'fixtures', 'python');

function getProjectDirectory(projectType) {
  const projectFixtures = join(fixtureDir, projectType);
  const projectDir = tmp.dirSync({} as any).name;

  fs.copySync(projectFixtures, projectDir);

  return projectDir;
}

describe('Python Agent Installation', () => {
  describe('poetry support', () => {
    let btInstaller: PoetryInstaller;

    beforeAll(() => {
      btInstaller = new PoetryInstaller(getProjectDirectory('poetry'));
    });

    it('detects poetry project', async () => {
      await expect(btInstaller.available()).resolves.toBe(true);
    });

    it('provides the correct init command', async () => {
      const cmdStruct = await btInstaller.initCommand();
      expect(cmdStruct.program).toBe('poetry');
      expect(cmdStruct.args).toEqual(['run', 'appmap-agent-init']);
    });
  });

  describe('pip support', () => {
    let btInstaller: PipInstaller;
    let projectDirectory: string;

    beforeAll(() => {
      projectDirectory = getProjectDirectory('pip');
      btInstaller = new PipInstaller(projectDirectory);
    });

    afterEach(() => {
      sinon.restore();
    });

    it('detects pip project', async () => {
      await expect(btInstaller.available()).resolves.toBe(true);
    });

    it('adds appmap to requirements.txt when missing', async () => {
      sinon.stub(commandRunner, 'run').resolves({ stderr: '', stdout: '' });

      await btInstaller.installAgent();
      const requirementsTxt = fs.readFileSync(join(projectDirectory, 'requirements.txt'), 'utf8');
      expect(requirementsTxt).toMatch(/^appmap>=/);
    });

    it('replaces existing appmap in requirements.txt', async () => {
      sinon.stub(commandRunner, 'run').resolves({ stderr: '', stdout: '' });

      const requirementsPath = join(projectDirectory, 'requirements.txt');
      fs.writeFileSync(requirementsPath, ' appmap == 1.0.0');

      await btInstaller.installAgent();
      const requirementsTxt = fs.readFileSync(join(projectDirectory, 'requirements.txt'), 'utf8');
      expect(requirementsTxt).toMatch(/^appmap>=/);
    });

    it("doesn't munge a non-matching requirement", async () => {
      sinon.stub(commandRunner, 'run').resolves({ stderr: '', stdout: '' });

      const requirementsPath = join(projectDirectory, 'requirements.txt');
      fs.writeFileSync(requirementsPath, ' not-appmap == 1.0.0');

      await btInstaller.installAgent();
      const requirementsTxt = fs.readFileSync(join(projectDirectory, 'requirements.txt'), 'utf8');
      expect(requirementsTxt).toMatch(/^appmap>=/m);
      expect(requirementsTxt).toMatch(/^ not-appmap == 1.0.0/m);
    });

    it('provides the correct init command', async () => {
      const cmdStruct = await btInstaller.initCommand();
      expect(cmdStruct.program).toBe('python3');
      expect(cmdStruct.args).toEqual(['-m', 'appmap.command.appmap_agent_init']);
    });
  });

  describe('pipenv support', () => {
    let btInstaller: PipenvInstaller;

    beforeAll(() => {
      btInstaller = new PipenvInstaller(getProjectDirectory('pipenv'));
    });

    it('detects pipenv project', async () => {
      await expect(btInstaller.available()).resolves.toBe(true);
    });

    it('provides the correct init command', async () => {
      const cmdStruct = await btInstaller.initCommand();
      expect(cmdStruct.program).toBe('pipenv');
      expect(cmdStruct.args).toEqual(['run', 'appmap-agent-init']);
    });
  });
});
