import { mkdtemp, open, rm, writeFile } from 'fs/promises';
import path from 'node:path';
import { tmpdir } from 'os';
import FileTooLargeError from '../../../src/fingerprint/fileTooLargeError';
import Fingerprinter from '../../../src/fingerprint/fingerprinter';
import * as utils from '../../../src/utils';
import { relative, resolve } from 'path';

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
      const fingerprinter = new Fingerprinter();
      await expect(fingerprinter.fingerprint(filePath)).rejects.toThrow(FileTooLargeError);
    })
  );

  it(
    'prints indexed events when verbose',
    withTempDir(async (dir) => {
      expect.assertions(1);

      const filePath = path.join(dir, 'test.appmap.json');
      await writeFile(filePath, JSON.stringify({ metadata: {} }));

      jest.spyOn(utils, 'verbose').mockReturnValue(true);
      const consoleSpy = jest.spyOn(console, 'log');

      // use relative path to test that the message resolves absolute back
      await new Fingerprinter().fingerprint(relative(process.cwd(), filePath));

      expect(consoleSpy.mock.calls).toContainEqual([`Indexed ${resolve(filePath)}`]);
    })
  );
});
