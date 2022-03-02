import path from 'path';
import { promises as fs } from 'fs';
import glob from 'glob';
import sinon from 'sinon';
import inquirer from 'inquirer';
import GradleInstaller from '../../../src/cmds/agentInstaller/gradleInstaller';
import EncodedFile from '../../../src/encodedFile';

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
    ['.gradle', '.gradle.kts'].forEach((testExt) => {
      const expectedExt = `${testExt}.expected`;
      const files = glob.sync(path.join(dataDir, `*${testExt}`));

      files.forEach((file) => {
        const test = path.basename(file, testExt);

        // By default, we'll run all test. This is here to make it easy to skip
        // them by name: change true to false, and check for the test name of
        // interest.
        const testFn = (true || test === 'extra-repo-block') ? it : xit;

        const actualFile = `${test}${testExt}`;

        testFn(`transforms ${actualFile} as expected`, async () => {
          const gradle = new GradleInstaller('.');

          sinon
            .stub(inquirer, 'prompt')
            .resolves({ addMavenCentral: 'Yes', userWillContinue: 'Continue' });

          sinon
            .stub(gradle, 'identifyGradleFile')
            .value(actualFile);

          sinon
            .stub(gradle, 'buildFilePath')
            .value(path.join(dataDir, actualFile));

          const efWrite = sinon.stub(EncodedFile.prototype, 'write');

          const ignoreWhitespaceDiff = false;

          let expected = await fs.readFile(
            path.join(dataDir, `${test}${expectedExt}`),
            'utf-8'
          );
          if (ignoreWhitespaceDiff) {
            expected = expected.replace(/[^\S\r\n]+/g, '');
          }
          await gradle.installAgent();

          let actual = efWrite.getCall(-1).args[0].toString();
          if (ignoreWhitespaceDiff) {
            actual = actual.replace(/[^\S\r\n]+/g, '');
          }
          expect(actual).toBe(expected);
          expect(actual).toMatchSnapshot();
        });
      });
    });
  });
});
