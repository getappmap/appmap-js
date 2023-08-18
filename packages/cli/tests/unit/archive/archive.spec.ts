import sinon, { SinonSandbox } from 'sinon';
import { handler } from '../../../src/cmds/archive/archive';
import assert from 'assert';
import path, { join } from 'path';
import { cleanProject, fixtureDir } from '../util';
import { existsSync, readFileSync, rmSync } from 'fs';
import gitRevision from '../../../src/cmds/archive/gitRevision';
import { readFile, writeFile } from 'fs/promises';

const originalWorkingDir = process.cwd();
const rubyFixturePath = path.join(fixtureDir, 'ruby');
const revokeApiKeyAppMapPath = join(rubyFixturePath, 'revoke_api_key.appmap.json');
const indexFolders = ['revoke_api_key', 'user_page_scenario'].map((folderName) =>
  path.join(rubyFixturePath, folderName)
);

const indexFileExists = (appmapFile: string, indexFile: string): boolean =>
  existsSync(join(join(rubyFixturePath, appmapFile, indexFile)));

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
    it('creates the expected files', async () => {
      await handler({
        directory: rubyFixturePath,
        analyze: true,
        threadCount: 3,
      });

      const expectedArchive = {
        workingDirectory: rubyFixturePath,
        appMapDir: '.',
        commandArguments: {
          directory: rubyFixturePath,
          analyze: true,
          threadCount: 3,
        },
        revision: currentCommit,
        failedTests: [],
        oversizedAppMaps: [],
        deletedAppMaps: undefined,
        config: {
          name: 'fixture-config',
          appmap_dir: '.',
        },
      };

      const actual = JSON.parse(String(readFileSync(appmapArchiveJsonPath)));

      Object.keys(expectedArchive).forEach((key) => {
        assert.deepEqual(
          actual[key],
          expectedArchive[key],
          `Expected ${key} to be ${JSON.stringify(expectedArchive[key])}, but got ${JSON.stringify(
            actual[key]
          )}`
        );
      });

      expect(indexFileExists('revoke_api_key', 'sequence.json')).toBe(true);
      expect(indexFileExists('user_page_scenario', 'sequence.json')).toBe(true);

      expect(indexFileExists('revoke_api_key', 'appmap-findings.json')).toBe(true);
      expect(indexFileExists('user_page_scenario', 'appmap-findings.json')).toBe(true);

      assert(existsSync(openApiPath));
      assert(existsSync(appmapTarballPath));
      assert(existsSync(archiveFolderPath));
      const fullArchivePath = path.join(archiveFolderPath, 'full', currentCommit + '.tar');
      assert(existsSync(fullArchivePath));
    });

    describe('when a test has failed', () => {
      beforeEach(async () => {
        // Update the test_status to 'failed'
        const appmap = JSON.parse(await readFile(revokeApiKeyAppMapPath, 'utf-8'));
        appmap.metadata.test_status = 'failed';
        await writeFile(revokeApiKeyAppMapPath, JSON.stringify(appmap, null, 2));
      });

      it('analyzes only the failed test', async () => {
        await handler({
          directory: rubyFixturePath,
          analyze: true,
          threadCount: 1,
        });

        const appmapArchive = JSON.parse(String(readFileSync(appmapArchiveJsonPath)));
        assert.deepEqual(appmapArchive.failedTests, ['revoke_api_key.appmap.json']);

        expect(indexFileExists('revoke_api_key', 'sequence.json')).toBe(true);
        expect(indexFileExists('user_page_scenario', 'sequence.json')).toBe(true);

        expect(indexFileExists('revoke_api_key', 'appmap-findings.json')).toBe(false);
        expect(indexFileExists('user_page_scenario', 'appmap-findings.json')).toBe(false);
      });
    });
  });

  it('fails when no appmaps are found', async () => {
    let err = {} as Error;
    try {
      await handler({ directory: 'no/such/dir', analyze: true, threadCount: 1 });
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
      analyze: true,
      outputDir: testOutputDirName,
      threadCount: 1,
    });

    const expectedArchiveFolderPath = path.join(rubyFixturePath, testOutputDirName);
    const expectedArchivePath = path.join(expectedArchiveFolderPath, currentCommit + '.tar');

    assert(existsSync(expectedArchivePath));
    rmSync(expectedArchiveFolderPath, { force: true, recursive: true });
  });

  it('correctly handles the output-file option', async () => {
    const testFileName = 'testFile.test';

    await handler({
      directory: rubyFixturePath,
      analyze: true,
      outputFile: testFileName,
      threadCount: 1,
    });

    const expectedFilePath = path.join(archiveFolderPath, 'full', testFileName);

    assert(existsSync(expectedFilePath));
  });

  it('correctly handles the max-size option', async () => {
    await handler({
      directory: rubyFixturePath,
      analyze: true,
      maxSize: 0,
      threadCount: 1,
    });

    assert(existsSync(appmapArchiveJsonPath));
    const archive = JSON.parse(String(readFileSync(appmapArchiveJsonPath)));
    const expectedOversized = ['revoke_api_key.appmap.json', 'user_page_scenario.appmap.json'];
    assert.deepEqual(archive.oversizedAppMaps.sort(), expectedOversized);
  });
});
