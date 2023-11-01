import emitUsage from '../../../src/lib/emitUsage';
import { dir } from 'tmp';
import { promisify } from 'node:util';
import { mkdir as mkdirCb, readFile as readFileCb, rm as rmCb } from 'graceful-fs';
import { chdir } from 'node:process';
import { UsageUpdateDto } from '@appland/client';
import { Git } from '../../../src/telemetry';

// Using graceful-fs should eliminate any risk of EBUSY errors on Windows.
const mkdir = promisify(mkdirCb);
const readFile = promisify(readFileCb);
const rm = promisify(rmCb);

describe('emitUsage', () => {
  let rootDirectory: string;
  const cwd = process.cwd();

  beforeEach(async () => {
    rootDirectory = await promisify(dir)();
    chdir(rootDirectory);
  });

  afterEach(async () => {
    chdir(cwd);
    await rm(rootDirectory, { recursive: true, force: true });
    jest.clearAllMocks();
  });

  describe('when the .appmap directory does not exist', () => {
    it('does not emit any run stats information', async () => {
      const resultPath = await emitUsage(process.cwd(), 1, 2);
      expect(resultPath).toBeUndefined();
    });
  });

  describe('when the .appmap directory exists', () => {
    const repository = 'my-repository';
    const branch = 'my-branch';
    const commit = 'my-commit';

    beforeEach(async () => {
      await mkdir('.appmap');
      jest.spyOn(Git, 'repository').mockResolvedValue(repository);
      jest.spyOn(Git, 'branch').mockResolvedValue(branch);
      jest.spyOn(Git, 'commit').mockResolvedValue(commit);
    });

    it('emits the expected run stats information', async () => {
      const numEvents = 1;
      const numAppMaps = 2;
      const metadata = { app: 'test', foo: 'bar' };

      const resultPath = await emitUsage(process.cwd(), numEvents, numAppMaps, metadata as any);
      expect(resultPath).toBeDefined();

      const dto = JSON.parse(await readFile(resultPath as string, 'utf-8')) as UsageUpdateDto;
      expect(dto).toMatchObject({
        events: numEvents,
        appmaps: numAppMaps,
        ci: Boolean(process.env.CI),
      });
      expect(dto.metadata).toMatchObject({
        app: metadata.app,
        git: {
          repository,
          branch,
          commit,
        },
      });
    });
  });
});
