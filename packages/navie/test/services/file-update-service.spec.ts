import { cp, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import tmp from 'tmp';

import InteractionHistory from '../../src/interaction-history';
import FileChangeExtractorService from '../../src/services/file-change-extractor-service';
import FileUpdateService from '../../src/services/file-update-service';

describe(FileUpdateService, () => {
  const example = (name: string) => async () => {
    expect.assertions(2);

    const fixtureDir = join(__dirname, 'file-update-service', name);
    await cp(fixtureDir, process.cwd(), { recursive: true });
    const apply = await readFile('apply.txt', 'utf8');
    const changes = FileChangeExtractorService.extractChanges(apply);

    const result = await service.apply(changes[0]);
    expect(result && result[0]).toEqual('File change applied to original.txt.\n');
    expect(await readFile('original.txt', 'utf8')).toEqual(await readFile('expected.txt', 'utf8'));
  };

  it('correctly applies an update even with broken whitespace', example('whitespace-mismatch'));
  it('correctly applies an update even with trailing newlines', example('trailing-newlines'));
  it('correctly applies an update even when blank lines mismatch', example('mismatch-blank-count'));
  it(
    'correctly applies an update even when there are repeated similar but mismatching lines',
    example('mismatched-similar')
  );

  let service: FileUpdateService;

  beforeEach(() => {
    service = new FileUpdateService(new InteractionHistory());
    const tmpDir = tmp.dirSync({ unsafeCleanup: true }).name;
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(startCwd);
  });
});

const startCwd = process.cwd();
