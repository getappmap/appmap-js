import sinon, { SinonSandbox } from 'sinon';
import assert from 'assert';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

import { handler } from '../../../src/cmds/compare/compare';
import { cleanProject, fixtureDir } from '../util';
import * as executeCmd from '../../../src/lib/executeCommand';
import { Paths } from '../../../src/cmds/compare/Paths';
import expectedReport from '../fixtures/compare/expected-change-report.json';

const originalWorkingDir = process.cwd();
const expectedBaseAppmaps = [
  'minitest/Microposts_controller_should_redirect_destroy_for_wrong_micropost',
  'minitest/Microposts_interface_micropost_interface',
  'minitest/User_associated_microposts_should_be_destroyed',
];
const expectedHeadAppMaps = [...expectedBaseAppmaps, 'minitest/Valid_login_redirect_after_login'];
const baseRevision = 'testBase';
const headRevision = 'testHead';
const compareFixturePath = path.join(fixtureDir, 'compare');
const changeReportPath = path.join(
  compareFixturePath,
  '.appmap',
  'change-report',
  `${baseRevision}-${headRevision}`,
  'change-report.json'
);

describe('compare command', () => {
  let sandbox: SinonSandbox;

  beforeAll(async () => {
    await cleanProject(compareFixturePath);
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(executeCmd, 'executeCommand').withArgs(sinon.match('git diff'));

    // For some reason glob is not working from within this test,
    // so the appmaps method in the Paths class is stubbed
    const appmapsStub = sandbox.stub(Paths.prototype, 'appmaps');
    appmapsStub.withArgs(sinon.match('base')).resolves(expectedBaseAppmaps);
    appmapsStub.withArgs(sinon.match('head')).resolves(expectedHeadAppMaps);
  });

  afterEach(async () => {
    sandbox.restore();
    await cleanProject(compareFixturePath);
  });

  afterAll(() => {
    process.chdir(originalWorkingDir);
  });

  it('creates the expected change report', async () => {
    await handler({
      directory: compareFixturePath,
      baseRevision,
      headRevision,
      sourceDir: '.',
      deleteUnreferenced: true,
      reportRemoved: true,
      clobberOutputDir: false,
    });
    assert(existsSync(changeReportPath));

    const actualReport = JSON.parse(String(readFileSync(changeReportPath)));
    assert.deepStrictEqual(actualReport, expectedReport);
  });
});
