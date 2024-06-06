import { cp, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import tmp from 'tmp';

import InteractionHistory from '../../src/interaction-history';
import FileChangeExtractorService from '../../src/services/file-change-extractor-service';
import FileUpdateService from '../../src/services/file-update-service';

describe(FileUpdateService, () => {
  it('correctly applies an update even with broken whitespace', async () => {
    expect.assertions(2);

    const fixtureDir = join(__dirname, 'file-update-service', 'whitespace-mismatch');
    await cp(fixtureDir, process.cwd(), { recursive: true });
    const apply = await readFile('apply.txt', 'utf8');
    const changes = FileChangeExtractorService.extractChanges(apply);

    const result = await service.apply(changes[0]);
    expect(result && result[0]).toEqual('File change applied to fields.py.\n');
    expect(await readFile('fields.py', 'utf8')).toEqual(
      await readFile('fields-expected.py', 'utf8')
    );
  });

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
