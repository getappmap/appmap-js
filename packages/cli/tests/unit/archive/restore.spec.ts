import sinon, { SinonSandbox } from 'sinon';
import { handler } from '../../../src/cmds/archive/restore';
import { handler as archive } from '../../../src/cmds/archive/archive';
import assert from 'assert';
import path from 'path';
import { cleanProject, fixtureDir } from '../util';
import { existsSync, rmSync } from 'fs';
import gitRevision from '../../../src/cmds/archive/gitRevision';
import * as scanFile from '../../../src/cmds/archive/scan';

const originalWorkingDir = process.cwd();
const rubyFixturePath = path.join(fixtureDir, 'ruby');
const indexFolders = ['revoke_api_key', 'user_page_scenario'].map((folderName) =>
  path.join(rubyFixturePath, folderName)
);

describe('restore command', () => {
  let sandbox: SinonSandbox;
  let currentCommit: string;

  beforeAll(async () => {
    await cleanProject(rubyFixturePath);
    currentCommit = await gitRevision();
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    process.chdir(originalWorkingDir);
    // Currently, scanning takes too long for these tests, so we'll stub it
    sandbox.stub(scanFile, 'scan').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
    await cleanProject(rubyFixturePath);
    indexFolders.forEach((folder) => rmSync(folder, { force: true, recursive: true }));
    rmSync(path.join(rubyFixturePath, '.appmap', 'work', 'fakeCommitName'), {
      force: true,
      recursive: true,
    });
  });

  afterAll(() => {
    process.chdir(originalWorkingDir);
  });

  it('creates the expected files and folders', async () => {
    await archive({
      directory: rubyFixturePath,
      analyze: true,
    });

    await handler({
      directory: rubyFixturePath,
      archiveDir: '.appmap/archive',
      revision: 'fakeCommitName',
      verbose: true,
    });

    const expectedAppPaths = [
      ['app', 'Gemfile'],
      ['app', 'controllers', 'organizations_controller.rb'],
      ['app', 'models', 'user.rb'],
      ['app', 'models', 'show.rb'],
      ['app', 'models', 'configuration.rb'],
    ].map((pathSegmentArr) => path.join(...pathSegmentArr));

    [
      'revoke_api_key.appmap.json',
      'user_page_scenario.appmap.json',
      'appmap_archive.json',
      'appmap.yml',
      'openapi.yml',
      ...expectedAppPaths,
    ].forEach((expectedPath) => {
      const fullPath = path.join(
        rubyFixturePath,
        '.appmap',
        'work',
        'fakeCommitName',
        expectedPath
      );
      assert(existsSync(fullPath), `Expecting path ${fullPath} to exist.`);
    });
  });

  it('should log a message and exit if check option is enabled', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called with "0"');
    });

    // Call the handler function with check set to true
    try {
      await handler({
        directory: rubyFixturePath,
        archiveDir: '.appmap/archive',
        revision: 'fakeCommitName',
        check: true,
      });
    } catch (error) {
      expect(error).toEqual(new Error('process.exit called with "0"'));
    }

    // Verify that the correct messages were logged
    expect(consoleSpy).toHaveBeenCalledWith(
      'Restoring AppMaps of revision fakeCommitName to .appmap/work/fakeCommitName'
    );
    expect(consoleSpy).toHaveBeenCalledWith('Found exact match full AppMap archive fakeCommitName');
    expect(consoleSpy).toHaveBeenCalledWith('Check option is enabled, not continuing to download.');

    // Restore the original process.exit function
    exitSpy.mockRestore();
  });
});
