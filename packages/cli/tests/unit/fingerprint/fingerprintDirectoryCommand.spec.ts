import { dir } from 'tmp';
import FingerprintDirectoryCommand from '../../../src/fingerprint/fingerprintDirectoryCommand';
import { promisify } from 'util';
import { writeFile, rm } from 'node:fs/promises';
import { join } from 'path';

const mkTmpDir = promisify(dir);

describe('index command', () => {
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
