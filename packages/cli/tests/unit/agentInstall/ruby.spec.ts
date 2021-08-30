/* eslint-disable no-restricted-syntax */
import { join } from 'path';
import tmp from 'tmp';
import fs from 'fs-extra';
import { BundleInstaller } from '../../../src/cmds/agentInstaller/rubyAgentInstaller';

tmp.setGracefulCleanup();

const fixtureDir = join(__dirname, '..', 'fixtures', 'ruby');

function getProjectDirectory(projectType) {
  const projectFixtures = join(fixtureDir, projectType);
  const projectDir = tmp.dirSync({} as any).name;

  fs.copySync(projectFixtures, projectDir);

  return projectDir;
}

describe('Ruby Agent Installation', () => {
  describe('bundler support', () => {
    let btInstaller: BundleInstaller;

    beforeEach(() => {
      btInstaller = new BundleInstaller(getProjectDirectory('app'));
    });

    it('detects bundler project', async () => {
      expect(btInstaller.available()).resolves.toBe(true);
    });

    it('provides the correct init command', async () => {
      const cmdStruct = btInstaller.initCommand();
      expect(cmdStruct.program).toBe('bundle');
      expect(cmdStruct.args).toEqual(['exec', 'appmap-agent-init']);
    });

    it('provides the correct validate command', async () => {
      const cmdStruct = await btInstaller.initCommand();
      expect(cmdStruct.program).toBe('bundle');
      expect(cmdStruct.args).toEqual(['exec', 'appmap-agent-validate']);
    });
  });
});
