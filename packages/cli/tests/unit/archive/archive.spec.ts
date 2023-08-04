import sinon, { SinonSandbox } from 'sinon';
import { handler } from '../../../src/cmds/archive/archive';
import assert from 'assert';
import path from 'path';
import { cleanProject, fixtureDir } from '../util';
import { existsSync, lstatSync, readFileSync, rm, rmSync } from 'fs';
import gitRevision from '../../../src/cmds/archive/gitRevision';
import * as scanFile from '../../../src/cmds/archive/scan';

const originalWorkingDir = process.cwd();
const rubyFixturePath = path.join(fixtureDir, 'ruby');
const indexFolders = ['revoke_api_key', 'user_page_scenario'].map((folderName) =>
  path.join(rubyFixturePath, folderName)
);

describe('archive command', () => {
  let sandbox: SinonSandbox;
  let currentCommit: string;
  const appmapFolderPath = path.join(rubyFixturePath, '.appmap');
  const archiveFolderPath = path.join(appmapFolderPath, 'archive');
  const appmapTarballPath = path.join(rubyFixturePath, 'appmaps.tar.gz');
  const appmapArchiveJsonPath = path.join(rubyFixturePath, 'appmap_archive.json');
  const openApiPath = path.join(rubyFixturePath, 'openapi.yml');

  beforeAll(async () => {
    await cleanProject(rubyFixturePath);
    currentCommit = await gitRevision();
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    // Currently, scanning takes too long for these tests, so we'll stub it
    sandbox.stub(scanFile, 'scan').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
    await cleanProject(rubyFixturePath);
    indexFolders.forEach((folder) => rmSync(folder, { force: true, recursive: true }));
  });

  afterAll(() => {
    process.chdir(originalWorkingDir);
  });

  describe('with a valid project with no previously created archive', () => {
    beforeEach(async () => {
      const argv = {
        directory: rubyFixturePath,
        analyze: true,
      };
      await handler(argv);
    });

    it('creates the expectecd appmap_archive.json', async () => {
      const expectedArchive = {
        workingDirectory: rubyFixturePath,
        appMapDir: '.',
        commandArguments: {
          directory: rubyFixturePath,
          analyze: true,
        },
        revision: currentCommit,
        config: {
          name: 'fixture-config',
          appmap_dir: '.',
        },
      };

      const actual = JSON.parse(String(readFileSync(appmapArchiveJsonPath)));

      Object.keys(expectedArchive).forEach((key) => {
        assert.deepEqual(actual[key], expectedArchive[key]);
      });
    });

    it('generates the openapi file', () => {
      assert(existsSync(openApiPath));
    });

    it('creates a tarball of appmaps', () => {
      assert(existsSync(appmapTarballPath));
    });

    it('creates the default .appmap folder and the full archive', async () => {
      assert(existsSync(archiveFolderPath));

      const fullArchivePath = path.join(archiveFolderPath, 'full', currentCommit + '.tar');
      assert(existsSync(fullArchivePath));
    });
  });

  it('fails when no appmaps are found', async () => {
    let err = {} as Error;
    try {
      await handler({ directory: 'no/such/dir' });
    } catch (e) {
      err = e as Error;
    }

    assert.deepEqual(err.name, 'Error');
    assert(err.message.includes('ENOENT'));
  });

  it('correctly handles a the output-dir option', async () => {
    const testOutputDirName = 'test';

    await handler({
      directory: rubyFixturePath,
      outputDir: testOutputDirName,
      analyze: true,
    });

    const expectedArchiveFolderPath = path.join(rubyFixturePath, testOutputDirName);
    const expectedArchivePath = path.join(expectedArchiveFolderPath, currentCommit + '.tar');

    assert(existsSync(expectedArchivePath));
    rmSync(expectedArchiveFolderPath, { force: true, recursive: true });
  });

  it('correclty handles the output-file option', async () => {
    const testFileName = 'testFile.test';

    await handler({
      directory: rubyFixturePath,
      outputFile: testFileName,
      analyze: true,
    });

    const expectedFilePath = path.join(archiveFolderPath, 'full', testFileName);

    assert(existsSync(expectedFilePath));
  });

  it('correctly handles the max-size option', async () => {
    await handler({
      directory: rubyFixturePath,
      maxSize: 0,
      analyze: true,
    });

    assert(existsSync(appmapArchiveJsonPath));
    const archive = JSON.parse(String(readFileSync(appmapArchiveJsonPath)));
    const expectedOversized = ['revoke_api_key.appmap.json', 'user_page_scenario.appmap.json'];
    assert.deepEqual(archive.oversizedAppMaps.sort(), expectedOversized);
  });
});
