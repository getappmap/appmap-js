/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { dir } from 'tmp';
import { promisify } from 'node:util';
import { readFile as readFileCb, rm as rmCb } from 'graceful-fs';
import { chdir } from 'node:process';

import { Usage, UsageUpdateDto } from '@appland/client';

import writeUsageData, { collectUsageData, sendUsageData } from '../../../src/lib/emitUsage';
import { Git } from '@appland/telemetry';

// Using graceful-fs should eliminate any risk of EBUSY errors on Windows.
const readFile = promisify(readFileCb);
const rm = promisify(rmCb);

describe('emitUsage', () => {
  let rootDirectory: string;
  let appmapDir: string;

  const cwd = process.cwd();

  const numEvents = 1;
  const numAppMaps = 2;
  const metadata = { app: 'test', foo: 'bar' };

  beforeEach(async () => {
    rootDirectory = await promisify(dir)();
    chdir(rootDirectory);

    appmapDir = process.cwd();
  });

  afterEach(async () => {
    chdir(cwd);
    await rm(rootDirectory, { recursive: true, force: true });
    jest.clearAllMocks();
  });

  describe('collectUsageData', () => {
    it('returns the correct usage data when metadata is provided', async () => {
      const usageData = await collectUsageData(appmapDir, numEvents, numAppMaps, metadata as any);
      expect(usageData).toMatchObject({
        events: numEvents,
        appmaps: numAppMaps,
        metadata: expect.any(Object),
        ci: Boolean(process.env.CI),
      });
    });

    it('returns the correct usage data when metadata is not provided', async () => {
      const usageData = await collectUsageData(appmapDir, numEvents, numAppMaps);
      expect(usageData).toMatchObject({
        events: numEvents,
        appmaps: numAppMaps,
        metadata: undefined,
        ci: Boolean(process.env.CI),
      });
    });
  });

  describe('writeUsageData', () => {
    describe('when the output directory exists or can be created', () => {
      const repository = 'my-repository';
      const branch = 'my-branch';
      const commit = 'my-commit';

      beforeEach(() => {
        jest.spyOn(Git, 'repository').mockResolvedValue(repository);
        jest.spyOn(Git, 'branch').mockResolvedValue(branch);
        jest.spyOn(Git, 'commit').mockResolvedValue(commit);
      });

      it('emits the expected run stats information', async () => {
        const usageData = await collectUsageData(appmapDir, numEvents, numAppMaps, metadata as any);
        const resultPath = await writeUsageData(usageData, appmapDir);
        expect(resultPath).toBeDefined();
        const dirName = rootDirectory.split('/').pop();
        expect(resultPath?.split('/')).toContain('.run-stats');
        expect(resultPath?.split('/')).toContain(dirName);

        const dto = JSON.parse(await readFile(resultPath!, 'utf-8')) as UsageUpdateDto;
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

  describe('sendUsageData', () => {
    let usageData: UsageUpdateDto;

    beforeEach(async () => {
      usageData = await collectUsageData(appmapDir, numEvents, numAppMaps, metadata as any);
    });

    it('the usage data can be sent successfully', async () => {
      jest.spyOn(Usage, 'update').mockResolvedValue(undefined);

      const response = await sendUsageData(usageData, appmapDir);
      expect(response.sent).toBe(true);
      expect(response.filePath).toBeUndefined();
    });

    describe('when the usage data is not sent successfully', () => {
      it('falls back to writing data to file on failure', async () => {
        jest.spyOn(Usage, 'update').mockImplementationOnce(() => {
          throw new Error('Mock API failure');
        });

        const response = await sendUsageData(usageData, appmapDir);
        expect(response.sent).toBe(false);
        expect(response.filePath).toBeDefined();
      });
    });
  });
});
