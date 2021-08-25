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

const installerForProject = (projectType, cmdRunner = null) => {
  const projectFixtures = join(fixtureDir, projectType);
  const projectDir = tmp.dirSync().name;

  fs.copySync(projectFixtures, projectDir);

  const agentInstaller = new JavaAgentInstaller(projectDir, cmdRunner);
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

function testAgentInit(installerFixture) {
  it('provides the correct agent init command', () => {
    const cmdRunner = {
      runSync: () => 'com.appland:appmap-agent.jar.path=appmap.jar',
      logger: {
        log: () => {},
      },
    };

    const btInstaller = buildToolInstaller(
      installerForProject(installerFixture, cmdRunner)
    );
    const cmdStruct = btInstaller.agentInitCommand;
    expect(cmdStruct.program).toBe('java');
    expect(cmdStruct.args).toStrictEqual([
      '-jar',
      'appmap.jar',
      '-d',
      btInstaller.path,
      'init',
    ]);
  });
}

describe('Java Agent Installation', () => {
  describe('gradle support', () => {
    it('detects gradle project', async () => {
      const installer = installerForProject('gradle/no-plugins');
      const btInstaller = buildToolInstaller(installer);
      expect(btInstaller).toBeInstanceOf(GradleInstaller);
    });

    it('uses the correct command to print the jar path', async () => {
      const btInstaller = buildToolInstaller(
        installerForProject('gradle/no-plugins')
      );
      const printCmd = btInstaller.printJarPathCommand;
      expect(printCmd.program).toBe('gradle');
      expect(printCmd.args).toStrictEqual(['appmap-print-jar-path']);
    });

    describe(
      'updates',
      testUpdates.bind(null, 'gradle', 'expected-build.gradle')
    );

    testAgentInit('gradle/no-plugins');
  });

  describe('maven support', () => {
    it('detects maven project', async () => {
      const installer = installerForProject('maven/no-plugins');
      const btInstaller = buildToolInstaller(installer);
      expect(btInstaller).toBeInstanceOf(MavenInstaller);
    });

    it('fails when project section is missing', async () => {
      const installer = installerForProject('maven-no-project');
      const btInstaller = buildToolInstaller(installer);
      expect(btInstaller.install()).rejects.toThrow(/No project section found/);
    });

    it('uses the correct command to print the jar path', async () => {
      const btInstaller = buildToolInstaller(
        installerForProject('maven/no-plugins')
      );
      const printCmd = btInstaller.printJarPathCommand;
      expect(printCmd.program).toBe('mvn');
      expect(printCmd.args).toStrictEqual(['appmap:print-jar-path']);
    });

    describe('updates', testUpdates.bind(null, 'maven', 'expected-pom.xml'));

    testAgentInit('maven/no-plugins');
  });
});
