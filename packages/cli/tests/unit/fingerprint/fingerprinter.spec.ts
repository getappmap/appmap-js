import { mkdtemp, open, rm } from 'fs/promises';
import path from 'node:path';
import { tmpdir } from 'os';
import FileTooLargeError from '../../../src/fingerprint/fileTooLargeError';
import Fingerprinter from '../../../src/fingerprint/fingerprinter';

function withTempDir<T>(closure: (dir: string) => Promise<T>): () => Promise<T> {
  return async function () {
    const dir = await mkdtemp(path.join(tmpdir(), 'appmap-test'));
    try {
      return await closure(dir);
    } finally {
      await rm(dir, { recursive: true });
    }
  };
}

describe(Fingerprinter, () => {
  it(
    'rejects appmaps that are too large',
    withTempDir(async (dir) => {
      const filePath = path.join(dir, 'too-large.appmap.json');
      const file = await open(filePath, 'w');
      await file.write('{}', 500 * 1000 * 1000);
      await file.close();
      const fingerprinter = new Fingerprinter(false);
      await expect(fingerprinter.fingerprint(filePath)).rejects.toThrow(FileTooLargeError);
    })
  );
});
