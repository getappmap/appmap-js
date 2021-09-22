/* eslint-disable no-restricted-syntax */
import { join } from 'path';
import tmp from 'tmp';
import fs from 'fs-extra';
import sinon, { SinonStub } from 'sinon';
import UI from '../../../src/cmds/agentInstaller/userInteraction';
import * as commandRunner from '../../../src/cmds/agentInstaller/commandRunner';
import {
  PoetryInstaller,
  PipInstaller,
  PipFallbackInstaller,
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
      expect(btInstaller.available()).resolves.toBe(true);
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
      expect(btInstaller.available()).resolves.toBe(true);
    });

    it('adds appmap to requirements.txt when missing', async () => {
      sinon.stub(commandRunner, 'run').resolves({ stderr: '', stdout: '' });

      await btInstaller.installAgent();
      const requirementsTxt = fs.readFileSync(
        join(projectDirectory, 'requirements.txt'),
        'utf8'
      );
      expect(requirementsTxt).toMatch(/^appmap>=/);
    });

    it('replaces existing appmap in requirements.txt', async () => {
      sinon.stub(commandRunner, 'run').resolves({ stderr: '', stdout: '' });

      const requirementsPath = join(projectDirectory, 'requirements.txt');
      fs.writeFileSync(requirementsPath, ' appmap == 1.0.0');

      await btInstaller.installAgent();
      const requirementsTxt = fs.readFileSync(
        join(projectDirectory, 'requirements.txt'),
        'utf8'
      );
      expect(requirementsTxt).toMatch(/^appmap>=/);
    });

    it("doesn't munge a non-matching requirement", async () => {
      sinon.stub(commandRunner, 'run').resolves({ stderr: '', stdout: '' });

      const requirementsPath = join(projectDirectory, 'requirements.txt');
      fs.writeFileSync(requirementsPath, ' not-appmap == 1.0.0');

      await btInstaller.installAgent();
      const requirementsTxt = fs.readFileSync(
        join(projectDirectory, 'requirements.txt'),
        'utf8'
      );
      expect(requirementsTxt).toMatch(/^appmap>=/m);
      expect(requirementsTxt).toMatch(/^ not-appmap == 1.0.0/m);
    });

    it('provides the correct init command', async () => {
      const cmdStruct = await btInstaller.initCommand();
      expect(cmdStruct.program).toBe('appmap-agent-init');
      expect(cmdStruct.args).toEqual([]);
    });
  });

  describe('pip global install (fallback)', () => {
    let btInstaller: PipFallbackInstaller;
    let projectDirectory: string;
    const { VIRTUAL_ENV } = process.env;
    let runStub: SinonStub;

    beforeAll(() => {
      // Let it run in an empty directory
      projectDirectory = tmp.dirSync({} as any).name;
      btInstaller = new PipFallbackInstaller(projectDirectory);

      runStub = sinon
        .stub(commandRunner, 'run')
        .resolves({ stderr: '', stdout: '' });
    });

    afterEach(() => {
      process.env.VIRTUAL_ENV = VIRTUAL_ENV;
      sinon.restore();
    });

    it('detects pip global installer as available when VIRTUAL_ENV is set', async () => {
      process.env.VIRTUAL_ENV = '.venv';
      expect(btInstaller.available()).resolves.toBe(true);
    });

    it('does not detect pip global installer as available when VIRTUAL_ENV is not set', async () => {
      process.env.VIRTUAL_ENV = undefined;
      expect(btInstaller.available()).resolves.toBe(true);
    });

    it('runs the correct install command', async () => {
      sinon.stub(UI, 'prompt').resolves({ globalInstall: true });

      await btInstaller.installAgent();

      const [command, args, path] = runStub.getCall(-1).args;
      expect(command).toBe('appmap-agent-init');
      expect(args).toEqual(['install', 'appmap']);
      expect(path).toEqual(projectDirectory);
    });
  });
});
