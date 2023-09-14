import sinon, { SinonSandbox } from 'sinon';
import { handler } from '../../../src/cmds/archive/archive';
import path, { join } from 'path';
import { cleanProject, fixtureDir } from '../util';
import { existsSync, rmSync } from 'fs';
import gitRevision from '../../../src/cmds/archive/gitRevision';

const originalWorkingDir = process.cwd();
const malformedParentIdPath = path.join(fixtureDir, 'malformedParentId');
const indexFolders = ['parent_id_49_does_not_exist', 'user_page_scenario'].map((folderName) =>
  path.join(malformedParentIdPath, folderName)
);

const indexFileExists = (appmapFile: string, indexFile: string): boolean =>
  existsSync(join(join(malformedParentIdPath, appmapFile, indexFile)));

describe('archive of a malformed AppMap', () => {
  let sandbox: SinonSandbox;
  let currentCommit: string;

  beforeAll(async () => {
    await cleanProject(malformedParentIdPath);
    currentCommit = await gitRevision();
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(async () => {
    sandbox.restore();
    await cleanProject(malformedParentIdPath);
    indexFolders.forEach((folder) => rmSync(folder, { force: true, recursive: true }));
  });

  afterAll(() => {
    process.chdir(originalWorkingDir);
  });

  it('reports the error and indexes the good file', async () => {
    await handler({
      directory: malformedParentIdPath,
      analyze: true,
      threadCount: 1,
    });

    expect(indexFileExists('user_page_scenario', 'sequence.json')).toBe(true);
    expect(indexFileExists('user_page_scenario', 'appmap-findings.json')).toBe(true);
  });

  describe('in verbose mode', () => {
    it('reports the error and indexes the good file', async () => {
      await handler({
        directory: malformedParentIdPath,
        analyze: true,
        threadCount: 1,
        verbose: true,
      });

      expect(indexFileExists('user_page_scenario', 'sequence.json')).toBe(true);
      expect(indexFileExists('user_page_scenario', 'appmap-findings.json')).toBe(true);
    });
  });
});
