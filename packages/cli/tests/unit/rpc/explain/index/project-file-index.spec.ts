import { writeFileSync } from 'node:fs';
import { dir, type DirectoryResult } from 'tmp-promise';

import { buildProjectFileIndex } from '../../../../../src/rpc/explain/index/project-file-index';
import ContentRestrictions from '../../../../../src/rpc/explain/ContentRestrictions';
import { join } from 'node:path';

describe('project-file-index', () => {
  const contentRestrictions = ContentRestrictions.instance;
  let project: DirectoryResult;

  beforeEach(async () => {
    ContentRestrictions.instance.reset();
    project = await dir({ unsafeCleanup: true });
    writeFileSync(join(project.path, 'restricted-file.js'), 'restricted');
    writeFileSync(join(project.path, 'allowed-file.js'), 'allowed');
  });

  it('should skip restricted files during indexing', async () => {
    contentRestrictions.setGlobalRestrictions(['**/restricted-file.js']);

    const sourceDirectories = [project.path];
    const includePatterns = undefined;
    const excludePatterns = undefined;

    const index = await buildProjectFileIndex(sourceDirectories, includePatterns, excludePatterns);
    const files = index.index.search('session', 'file');

    expect(files.filter((f) => f.filePath.includes('restricted-file.js')).length).toBe(0);
    expect(files.filter((f) => f.filePath.includes('allowed-file.js')).length).toBe(1);
  });

  afterEach(() => {
    void project.cleanup();
    ContentRestrictions.instance.reset();
  });
});
