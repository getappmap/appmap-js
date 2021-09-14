import path from 'path';
import { promises as fs } from 'fs';
import { glob as globCallback } from 'glob';
import { promisify } from 'util';
import sinon from 'sinon';
import inquirer from 'inquirer';
import { GradleInstaller } from '../../../src/cmds/agentInstaller/gradleInstaller';

const glob = promisify(globCallback);
const fixtureDir = path.join(__dirname, '..', 'fixtures', 'java', 'gradle');

describe('GradleInstaller', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('available', () => {
    it('detects a gradle project', () => {
      const projectDirectory = path.join(fixtureDir, 'example-project');
      const maven = new GradleInstaller(projectDirectory);
      expect(maven.available()).resolves.toBe(true);
    });
  });

  describe('installAgent', () => {
    it('transforms build.gradle as expected', async () => {
      const dataDir = path.join(fixtureDir, 'data');
      const gradle = new GradleInstaller('.');
      const expectedExt = '.expected.gradle';
      const files = await glob(path.join(dataDir, `*${expectedExt}`));
      const tests = files.map((file) => path.basename(file, expectedExt));
      const writeFile = sinon.stub(fs, 'writeFile');

      sinon
        .stub(inquirer, 'prompt')
        .resolves({ addMavenCentral: 'Yes', userWillContinue: 'Continue' });

      for (let i = 0; i < tests.length; ++i) {
        const test = tests[i];
        sinon
          .stub(gradle, 'buildFilePath')
          .value(path.join(dataDir, `${test}.actual.gradle`));

        const expected = (
          await fs.readFile(path.join(dataDir, `${test}${expectedExt}`))
        ).toString();

        await gradle.installAgent();

        const actual = writeFile.getCall(-1).args[1];
        expect(actual).toBe(expected);
      }
    });
  });
});
