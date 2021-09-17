import path from 'path';
import { promises as fs } from 'fs';
import glob from 'glob';
import sinon from 'sinon';
import inquirer from 'inquirer';
import { GradleInstaller } from '../../../src/cmds/agentInstaller/gradleInstaller';

const fixtureDir = path.join(__dirname, '..', 'fixtures', 'java', 'gradle');
const dataDir = path.join(fixtureDir, 'data');

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
    const expectedExt = '.expected.gradle';
    const files = glob.sync(path.join(dataDir, `*${expectedExt}`));
    const tests = files.map((file) => path.basename(file, expectedExt));

    tests.forEach((test) => {
      it('transforms build.gradle as expected', async () => {
        const gradle = new GradleInstaller('.');

        sinon
          .stub(inquirer, 'prompt')
          .resolves({ addMavenCentral: 'Yes', userWillContinue: 'Continue' });

        sinon
          .stub(gradle, 'buildFilePath')
          .value(path.join(dataDir, `${test}.actual.gradle`));

        const writeFile = sinon.stub(fs, 'writeFile');

        const expected = (
          await fs.readFile(path.join(dataDir, `${test}${expectedExt}`))
        ).toString();

        await gradle.installAgent();

        const actual = writeFile.getCall(-1).args[1];
        expect(actual).toBe(expected);
      });
    });
  });
});
