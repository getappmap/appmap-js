import { dir } from 'tmp';
import FingerprintDirectoryCommand from '../../../src/fingerprint/fingerprintDirectoryCommand';
import { promisify } from 'util';
import { writeFile, rm, cp, readdir } from 'node:fs/promises';
import { join } from 'path';

const mkTmpDir = promisify(dir);

describe('index command', () => {
  describe('identifying AppMaps', () => {
    let appMapDir: string;
    let appMapPath: string;

    beforeEach(async () => {
      appMapDir = await mkTmpDir();
      appMapPath = join(appMapDir, 'example.appmap.json');
      await writeFile(appMapPath, '{}');
    });

    afterEach(() => rm(appMapDir, { recursive: true, force: true }));

    it('identifies AppMaps for indexing', () => {
      const subject = new FingerprintDirectoryCommand(appMapDir);
      return expect(subject.files(() => {})).resolves.toEqual([appMapPath]);
    });
  });

  describe('fingerprinting a directory', () => {
    let appMapDir: string;

    beforeEach(async () => {
      appMapDir = await mkTmpDir();
      // A real recording so execute() exercises the full fingerprint pipeline
      // (canonicalization, hashing, index-file emission), not just globbing.
      await cp(
        join(__dirname, '..', 'fixtures', 'ruby', 'revoke_api_key.appmap.json'),
        join(appMapDir, 'revoke_api_key.appmap.json')
      );
    });

    afterEach(() => rm(appMapDir, { recursive: true, force: true }));

    it('fingerprints AppMaps and writes an index', async () => {
      const subject = new FingerprintDirectoryCommand(appMapDir);
      const count = await subject.execute();
      expect(count).toBe(1);
      // The index is written into a directory named after the AppMap.
      const indexDir = join(appMapDir, 'revoke_api_key');
      const indexFiles = await readdir(indexDir);
      expect(indexFiles).toContain('metadata.json');
    });
  });
});
