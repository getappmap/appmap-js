/* eslint-disable no-restricted-syntax */
import path from 'path';
import tmp from 'tmp';
import fs from 'fs-extra';
import { BundleInstaller } from '../../../src/cmds/agentInstaller/rubyAgentInstaller';
import * as commandRunner from '@appland/common/src/commandRunner';
import CommandStruct, { CommandReturn } from '@appland/common/src/commandStruct';
import sinon from 'sinon';

tmp.setGracefulCleanup();

const fixtureDir = path.join(__dirname, '..', 'fixtures', 'ruby');

function getProjectDirectory(projectFixtures: fs.PathLike) {
  const projectDir = tmp.dirSync({} as any).name;

  fs.copySync(projectFixtures.toString(), projectDir);

  return projectDir;
}

describe('Ruby Agent Installation', () => {
  describe('bundler support', () => {
    let btInstaller: BundleInstaller;
    let projectFixtures;

    beforeEach(() => {
      const projectType = 'app';
      projectFixtures = path.join(fixtureDir, projectType);
      btInstaller = new BundleInstaller(getProjectDirectory(projectFixtures));
    });

    afterEach(() => {
      sinon.restore();
    });

    it('detects bundler project', async () => {
      expect(btInstaller.available()).resolves.toBe(true);
    });

    it('provides the correct init command', async () => {
      const cmdStruct = await btInstaller.initCommand();
      expect(cmdStruct.program).toBe('bundle');
      expect(cmdStruct.args).toEqual(['exec', 'appmap-agent-init']);
    });

    it('updates the Gemfile', async () => {
      const bundleInstall = (cmdStruct: CommandStruct): Promise<CommandReturn> => {
        expect(cmdStruct.program).toEqual('bundle');
        expect(cmdStruct.args).toEqual(['install']);
        return Promise.resolve({ stdout: '', stderr: '', code: 0 });
      };

      const checkBundlerConfig = (cmdStruct: CommandStruct) => {
        expect(cmdStruct.program).toEqual('bundle');
        expect(cmdStruct.args).toEqual(['config', 'get', 'without']);
        return Promise.resolve({
          stdout:
            'Set for your local app (/home/ahtrotta/projects/land-of-apps/sample_app_6th_ed/.bundle/config): [:test]',
          stderr: '',
          code: 0
        });
      };

      let callIdx = 0;
      sinon
        .stub(commandRunner, 'run')
        .onCall(callIdx++)
        .callsFake(checkBundlerConfig)
        .onCall(callIdx++)
        .callsFake(bundleInstall);

      await btInstaller.installAgent();

      const expected = fs.readFileSync(path.join(projectFixtures, 'Gemfile.expected'), 'utf-8');
      const actual = fs.readFileSync(path.join(btInstaller.path, 'Gemfile'), 'utf-8');
      expect(actual).toBe(expected);
    });
  });
});
