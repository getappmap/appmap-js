import fs from 'fs';
import { join } from 'path';
import tmp from 'tmp';

import EncodedFile from '../../src/encodedFile';

tmp.setGracefulCleanup();
describe('EncodedFile', () => {
  let tmpDir: string;
  let fixtureDir: string;
  beforeEach(() => {
    tmpDir = tmp.dirSync({} as any).name;
    fixtureDir = join(__dirname, 'fixtures', 'encodedFile');
  });

  const verifyUpdate = (prefix: string, eol: string) => {
    const inputPath = join(fixtureDir, `${prefix}.txt`);
    const actualPath = join(tmpDir, `${prefix}.actual.txt`);
    const ef = new EncodedFile(inputPath);
    const newString = `# New text${eol}` + ef.toString();
    ef.write(newString, actualPath);

    const expectedPath = join(fixtureDir, `${prefix}.expected.txt`);
    const expected = fs.readFileSync(expectedPath);
    const actual = fs.readFileSync(actualPath);
    expect(actual).toEqual(expected);
  };

  [
    ['windows', '\r\n'],
    ['unix', '\n'],
  ].forEach((v) => {
    const [platform, lineEndings] = v;
    describe(`with ${platform} line-endings`, () => {
      beforeEach(() => {
        fixtureDir = join(__dirname, 'fixtures', 'encodedFile', platform);
      });

      it('decodes a UTF-16 file', () => {
        const ef = new EncodedFile(join(fixtureDir, 'utf16le.txt'));
        const str = ef.toString();
        expect(str[0]).toEqual('#');
      });

      it('writes an updated UTF-16 file', () => {
        verifyUpdate('utf16le', lineEndings);
      });
    });
  });

  it('reads a 7-bit ASCII file', () => {
    const ef = new EncodedFile(join(fixtureDir, 'ascii.txt'));
    const str = ef.toString();
    expect(str[0]).toEqual('#');
  });

  it('writes a 7-bit ASCII file', () => {
    verifyUpdate('ascii', '\n');
  });

  it('raises an error if the file is UTF-8', () => {
    expect(() => {
      new EncodedFile(join(fixtureDir, 'utf8.txt'));
    }).toThrowError(/Unknown encoding/);
  });

  it('reads an empty file', () => {
    const ef = new EncodedFile(join(fixtureDir, 'empty.txt'));
    const str = ef.toString();
    expect(str).toEqual('');
  });
});
