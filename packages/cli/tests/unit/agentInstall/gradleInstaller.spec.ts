import path from 'path';
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


          await gradle.installAgent();

          let actual = efWrite.getCall(-1).args[0].toString();
          expect(actual).toMatchSnapshot();
        });
      });
    });
  });
});
