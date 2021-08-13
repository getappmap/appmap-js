const { join } = require('path');
const tmp = require('tmp');
const fs = require('fs-extra');
const glob = require('glob');

const {
  JavaAgentInstaller,
  GradleInstaller,
  MavenInstaller,
} = require('../../../src/cmds/agentInstaller/javaAgentInstaller');

tmp.setGracefulCleanup();

const fixtureDir = join(__dirname, '..', 'fixtures', 'java');

const installerForProject = (projectType) => {
  const projectFixtures = join(fixtureDir, projectType);
  const projectDir = tmp.dirSync().name;

  fs.copySync(projectFixtures, projectDir);

  const agentInstaller = new JavaAgentInstaller(projectDir);
  return agentInstaller;
};

const buildToolInstaller = (installer) =>
  installer.installAgentFlow.buildToolInstaller;

function testUpdates(installerType, expectedResultsFile, focus = null) {
  const gradleFixtures = glob.sync('*', {
    cwd: join(fixtureDir, installerType),
  });
  gradleFixtures.forEach((p) => {
    if (focus && p !== focus) {
      return;
    }

    it(`${p} project`, async () => {
      const installer = installerForProject(join(installerType, p));
      const btInstaller = buildToolInstaller(installer);
      await btInstaller.install();
      const expected = fs
        .readFileSync(join(btInstaller.path, expectedResultsFile))
        .toString();
      const actual = fs.readFileSync(btInstaller.buildFilePath).toString();

      expect(actual).toBe(expected);
    });
  });
}

describe('Java Agent Installation', () => {
  describe('gradle support', () => {
    it('detects gradle project', async () => {
      const installer = installerForProject('gradle/app');
      const btInstaller = buildToolInstaller(installer);
      expect(btInstaller).toBeInstanceOf(GradleInstaller);
    });

    describe(
      'updates',
      testUpdates.bind(null, 'gradle', 'expected-build.gradle')
    );
  });

  describe('maven support', () => {
    it('detects maven project', async () => {
      const installer = installerForProject('maven/plugins');
      const btInstaller = buildToolInstaller(installer);
      expect(btInstaller).toBeInstanceOf(MavenInstaller);
    });

    it.only('fails when project section is missing', async () => {
      const installer = installerForProject('maven-no-project');
      const btInstaller = buildToolInstaller(installer);
      expect(btInstaller.install()).rejects.toThrow(/No project section found/);
    });

    describe('updates', testUpdates.bind(null, 'maven', 'expected-pom.xml'));
  });
});
