import sinon, { SinonSandbox } from 'sinon';
import assert from 'assert';
import { existsSync, readFileSync, readdirSync, statSync, write } from 'fs';
import path, { join } from 'path';

import { handler } from '../../../src/cmds/compare/compare';
import { cleanProject, fixtureDir } from '../util';
import * as executeCmd from '../../../src/lib/executeCommand';
import { Paths } from '../../../src/diffArchive/Paths';
import { RevisionName } from '../../../src/diffArchive/RevisionName';

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

    for (const revisionName of [RevisionName.Base, RevisionName.Head])
      appmaps.withArgs(sinon.match(revisionName)).resolves(listAppMaps(revisionName));
  }

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(executeCmd, 'executeCommand').withArgs(sinon.match('git diff'));
    appmaps = sandbox.stub(Paths.prototype, 'appmaps');
  });

  afterEach(async () => sandbox.restore());
  afterEach(async () => await cleanProject(projectDir));
  afterEach(async () => process.chdir(originalWorkingDir));

  describe('when some tests failed', () => {
    const scenarioName = 'some-failed';
    const [baseRevision, headRevision] = scenarioName.split('-');

    it('creates the expected change report', async () => {
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
  describe('when all tests passed', () => {
    const scenarioName = 'all-succeeded';
    const [baseRevision, headRevision] = scenarioName.split('-');

    it('creates the expected change report', async () => {
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
  describe('when an OpenAPI document is invalid', () => {
    const scenarioName = 'invalid-openapi';
    const [baseRevision, headRevision] = scenarioName.split('-');

    it('a warning is reported', async () => {
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
});
