import sinon, { SinonSandbox } from 'sinon';
import assert from 'assert';
import { existsSync, readFileSync, readdirSync, statSync, write } from 'fs';
import path, { join } from 'path';

import { handler } from '../../../src/cmds/compare/compare';
import { cleanProject, fixtureDir } from '../util';
import * as executeCmd from '../../../src/lib/executeCommand';
import { Paths } from '../../../src/cmds/compare/Paths';
import { RevisionName } from '../../../src/cmds/compare/RevisionName';

const originalWorkingDir = process.cwd();
const projectDir = path.join(fixtureDir, 'compare');

function changeReportDir(scenarioName: string): string {
  return path.join(projectDir, '.appmap', 'change-report', scenarioName);
}

function changeReportFile(scenarioName: string): string {
  return path.join(changeReportDir(scenarioName), 'change-report.json');
}

describe('compare command', () => {
  let sandbox: SinonSandbox;

  // For some reason glob is not working from within this test,
  // so the appmaps method in the Paths class is stubbed
  let appmaps: sinon.SinonStub;

  beforeAll(async () => {
    await cleanProject(projectDir);
  });

  function mockBaseAndHeadAppMaps(scenarioName: string) {
    const isDirectory = (file: string): boolean => {
      const stat = statSync(file);
      return stat.isDirectory();
    };

    const listAppMaps = (revisionName: RevisionName): string[] => {
      const baseDir = join(changeReportDir(scenarioName), revisionName, 'minitest');
      return readdirSync(baseDir)
        .filter((file) => isDirectory(join(baseDir, file)))
        .map((f) => join('minitest', f));
    };
    // const expectedCommonAppMaps = [
    //   'minitest/Microposts_controller_should_redirect_destroy_for_wrong_micropost',
    //   'minitest/Microposts_interface_micropost_interface',
    //   'minitest/User_associated_microposts_should_be_destroyed',
    // ];
    // const expectedBaseAppmaps = [...expectedCommonAppMaps, 'minitest/User_mailer_password_reset'];
    // const expectedHeadAppMaps = [
    //   ...expectedCommonAppMaps,
    //   'minitest/Valid_login_redirect_after_login',
    // ];

    for (const revisionName of [RevisionName.Base, RevisionName.Head])
      appmaps.withArgs(sinon.match(revisionName)).resolves(listAppMaps(revisionName));
  }

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(executeCmd, 'executeCommand').withArgs(sinon.match('git diff'));
    appmaps = sandbox.stub(Paths.prototype, 'appmaps');
  });

  afterEach(async () => {
    sandbox.restore();
    await cleanProject(projectDir);
  });

  afterAll(() => {
    process.chdir(originalWorkingDir);
  });

  describe('when some tests failed', () => {
    it('creates the expected change report', async () => {
      const scenarioName = 'some-failed';
      const [baseRevision, headRevision] = scenarioName.split('-');
      mockBaseAndHeadAppMaps(scenarioName);

      const expectedReport = JSON.parse(readFileSync(changeReportFile(scenarioName), 'utf-8'));
      await handler({
        directory: projectDir,
        baseRevision,
        headRevision,
        sourceDir: '.',
        deleteUnreferenced: true,
        reportRemoved: true,
        clobberOutputDir: false,
      });
      assert(existsSync(changeReportFile(scenarioName)));
      const actualReport = JSON.parse(readFileSync(changeReportFile(scenarioName), 'utf-8'));
      assert.deepStrictEqual(actualReport, expectedReport);
    });
  });
  // describe('when all tests passed', () => {
  //   beforeEach(async () => {
  //     const appmaps = new Set([...expectedBaseAppmaps, ...expectedHeadAppMaps]);
  //     for (const appmap of appmaps) {
  //       for (const revisionName of ['base', 'head']) {
  //         const metadataFile = join(
  //           dirname(changeReportPath),
  //           revisionName,
  //           appmap,
  //           'metadata.json'
  //         );
  //         if (!existsSync(metadataFile)) continue;

  //         const metadata = await JSON.parse(await readFile(metadataFile, 'utf-8'));
  //         if (metadata.test_status === 'failed') {
  //           warn(`Reverting ${appmap} to 'succeeded'`);
  //           metadata.test_status = 'succeeded';
  //           delete metadata['test_failure'];
  //           await writeFile(metadataFile, JSON.stringify(metadata));
  //         }
  //       }
  //     }
  //   });
  //   it('creates the expected change report', async () => {
  //     await handler({
  //       directory: compareFixturePath,
  //       baseRevision,
  //       headRevision,
  //       sourceDir: '.',
  //       deleteUnreferenced: true,
  //       reportRemoved: true,
  //       clobberOutputDir: false,
  //     });
  //     assert(existsSync(changeReportPath));

  //     const actualReport = JSON.parse(String(readFileSync(changeReportPath)));
  //     assert.deepStrictEqual(actualReport, expectedReport);
  //   });
  // });
});
