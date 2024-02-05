import UpToDate, { AppMapIndex } from '../../../src/lib/UpToDate';
import { verbose } from '../../../src/utils';

describe('UpToDate', () => {
  beforeAll(() => verbose(process.env.DEBUG === 'true'));
  afterEach(() => jest.restoreAllMocks());

  const aSecondAgo = Date.now() - 1000;

  let appMapIndex: AppMapIndex;
  let upToDate: UpToDate;

  describe('when the AppMap file mtime cannot be determined', () => {
    beforeEach(() => {
      const updatedAt = jest.fn().mockResolvedValue(undefined);
      appMapIndex = {
        updatedAt,
      } as any;
      upToDate = new UpToDate();
      upToDate.appMapIndex = appMapIndex;
    });

    it('should return undefined', async () => {
      const result = await upToDate.isOutOfDate('appmap');
      expect(result).toBeUndefined();
    });
  });

  describe('with ClassMap', () => {
    beforeEach(() => {
      const updatedAt = jest.fn().mockResolvedValue(aSecondAgo);
      appMapIndex = {
        updatedAt,
        classMap: jest.fn().mockResolvedValue([
          {
            location: 'file1.rb',
            children: [
              {
                location: 'file2.rb',
              },
            ],
          },
        ]),
      } as any;
      upToDate = new UpToDate();
      upToDate.appMapIndex = appMapIndex;
    });

    it('determines the modification time of each file once', async () => {
      // It doesn't matter for this test what the result is
      upToDate.mtime = jest.fn().mockResolvedValue(aSecondAgo - 1000);

      await upToDate.isOutOfDate('appmap');
      expect(upToDate.mtime).toHaveBeenCalledTimes(2);
      expect(upToDate.mtimeCacheHits).toBe(0);

      await upToDate.isOutOfDate('appmap');
      expect(upToDate.mtime).toHaveBeenCalledTimes(2);
      expect(upToDate.mtimeCacheHits).toBe(2);
    });

    describe('when source files are older than the AppMap file', () => {
      beforeEach(() => {
        upToDate.mtime = jest.fn().mockResolvedValue(aSecondAgo - 1000);
      });

      it('should return undefined', async () => {
        const result = await upToDate.isOutOfDate('appmap');
        expect(result).toBeUndefined();
      });
    });
    describe('when a source file is newer than the AppMap file', () => {
      beforeEach(() => {
        upToDate.mtime = jest.fn().mockResolvedValue(aSecondAgo + 1000);
      });

      it('should return the relevant set of source files', async () => {
        const result = await upToDate.isOutOfDate('appmap');
        expect(result).toEqual(new Set(['file1.rb', 'file2.rb']));
      });
    });
  });
});
