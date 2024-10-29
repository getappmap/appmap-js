import { cp, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import tmp from 'tmp';

import applyFileUpdate from '../../../../src/rpc/file/applyFileUpdate';
import { load } from 'js-yaml';

type Change = {
  file: string;
  original: string;
  modified: string;
};

const startCwd = process.cwd();

describe(applyFileUpdate, () => {
  beforeEach(() => {
    const tmpDir = tmp.dirSync({ unsafeCleanup: true }).name;
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(startCwd);
  });

  const example = (name: string) => async () => {
    expect.assertions(1);

    const fixtureDir = join(__dirname, 'applyFileUpdate', name);
    await cp(fixtureDir, process.cwd(), { recursive: true });
    const applyStr = await readFile('apply.yml', 'utf8');
    const change = load(applyStr) as Change;
    const { file, original, modified } = change;

    await applyFileUpdate(file, original, modified);

    const updatedStr = await readFile('original.txt', 'utf8');
    const expectedStr = await readFile('expected.txt', 'utf8');

    expect(updatedStr).toEqual(expectedStr);
  };

  it('correctly applies an update even with broken whitespace', example('whitespace-mismatch'));
  it('correctly applies an update even with trailing newlines', example('trailing-newlines'));
  it('correctly applies an update even when blank lines mismatch', example('mismatch-blank-count'));
  it(
    'correctly applies an update even when there are repeated similar but mismatching lines',
    example('mismatched-similar')
  );
});
