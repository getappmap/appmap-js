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

    files.forEach((file) => {
      const test = path.basename(file, expectedExt);
      if (false && test !== 'empty') {
        return;
      }
      
      const actualFile = `${test}.gradle`;

      it(`transforms ${actualFile} as expected`, async () => {
        const gradle = new GradleInstaller('.');

        sinon
          .stub(inquirer, 'prompt')
          .resolves({ addMavenCentral: 'Yes', userWillContinue: 'Continue' });

        sinon
          .stub(gradle, 'buildFilePath')
          .value(path.join(dataDir, actualFile));

        const writeFile = sinon.stub(fs, 'writeFile');

        const ignoreWhitespaceDiff = false;

        let expected = await fs.readFile(path.join(dataDir, `${test}${expectedExt}`), 'utf-8');
        if (ignoreWhitespaceDiff) {
          expected = expected.replace(/[^\S\r\n]+/g, '');
        }
        await gradle.installAgent();

        let actual = writeFile.getCall(-1).args[1].toString();
        if (ignoreWhitespaceDiff) {
          actual = actual.replace(/[^\S\r\n]+/g, '');
        }
        if (actual !== expected) {
          console.log(actual);
        }

        expect(actual).toBe(expected);
      });
    });
  });
});
