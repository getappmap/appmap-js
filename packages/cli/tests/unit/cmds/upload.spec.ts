import { handler } from '../../../src/cmds/upload';

import path from 'node:path';
import fs from 'node:fs/promises';

import * as client from '@appland/client';
import UI_ from '../../../src/cmds/userInteraction';
import * as utils from '../../../src/utils';
import { Stats } from 'node:fs';
import * as appNameFromConfig from '../../../src/lib/appNameFromConfig';
import * as locateAppMapDir from '../../../src/lib/locateAppMapDir';

const AppMapDir = path.join(__dirname, '../', 'fixtures', 'stats');

describe('upload command', () => {
  describe('when app exists', () => {
    beforeEach(() => jest.spyOn(App.prototype, 'exists').mockResolvedValue(true));

    it('uploads appmaps', async () => {
      expect.assertions(3);

      await handler({});

      expect(UI.success).toHaveBeenCalledWith(
        'Created mapset https://appmap.test/applications/69/mapsets/42 with 3 AppMaps'
      );
      expect(AppMap.create).toHaveBeenCalledTimes(3);
      expect(Mapset.create).toHaveBeenCalledWith('sample_app_6th_ed', mapIds, expect.anything());
    });

    it('allows overriding the app name', async () => {
      expect.assertions(1);
      await handler({ app: 'test-app' });
      expect(Mapset.create).toHaveBeenCalledWith('test-app', mapIds, expect.anything());
    });

    it('aborts in case of an error while checking', async () => {
      expect.assertions(5);

      jest.spyOn(fs, 'readFile').mockRejectedValueOnce(new Error('test error while reading'));

      await expect(handler({})).rejects.toThrowError();

      expect(fs.readFile).toHaveBeenCalledTimes(1);
      expect(UI.success).not.toHaveBeenCalled();
      expect(AppMap.create).not.toHaveBeenCalled();
      expect(Mapset.create).not.toHaveBeenCalled();
    });

    it('aborts in case of an error while uploading', async () => {
      expect.assertions(4);

      AppMap.create.mockRejectedValue(new Error('test error while uploading'));

      await expect(handler({})).rejects.toThrowError();

      expect(UI.success).not.toHaveBeenCalled();
      expect(AppMap.create).toHaveBeenCalledTimes(1);
      expect(Mapset.create).not.toHaveBeenCalled();
    });

    it('aborts in case no appmaps found', async () => {
      expect.assertions(4);

      jest.spyOn(utils, 'listAppMapFiles').mockResolvedValue();

      await expect(handler({})).rejects.toThrowError();

      expect(UI.success).not.toHaveBeenCalled();
      expect(AppMap.create).not.toHaveBeenCalled();
      expect(Mapset.create).not.toHaveBeenCalled();
    });

    it('skips files that are too large', async () => {
      expect.assertions(4);

      jest.spyOn(fs, 'stat').mockImplementationOnce(async (path, opts) => {
        const stat = await fs.stat(path, opts);
        return { ...stat, size: 128 * 1024 * 1024 } as Stats;
      });

      await expect(handler({})).rejects.toThrowError();

      expect(UI.success).not.toHaveBeenCalled();
      expect(AppMap.create).not.toHaveBeenCalled();
      expect(Mapset.create).not.toHaveBeenCalled();
    });

    it('can force oversize upload', async () => {
      expect.assertions(3);

      jest.spyOn(fs, 'stat').mockImplementationOnce(async (path, opts) => {
        const stat = await fs.stat(path, opts);
        return { ...stat, size: 128 * 1024 * 1024 } as Stats;
      });

      await handler({ force: true });

      expect(UI.success).toHaveBeenCalled();
      expect(AppMap.create).toHaveBeenCalledTimes(3);
      expect(Mapset.create).toHaveBeenCalled();
    });
  });

  describe("when app doesn't exist", () => {
    beforeEach(() => jest.spyOn(App.prototype, 'exists').mockResolvedValue(false));

    it('aborts', async () => {
      await expect(handler({})).rejects.toThrowError(/does not exist/);
    });
  });
});

const mapIds = ['foo', 'bar', 'baz'];
let cwd: string | undefined;

beforeEach(() => {
  cwd = process.cwd();

  jest.restoreAllMocks();
  jest.resetAllMocks();

  jest.spyOn(locateAppMapDir, 'locateAppMapDir').mockResolvedValue(AppMapDir);
  jest.spyOn(appNameFromConfig, 'appNameFromConfig').mockResolvedValue('sample_app_6th_ed');

  const idsIter = mapIds[Symbol.iterator]();
  jest.mocked(client.loadConfiguration).mockReturnValue({ baseURL: 'https://appmap.test' });

  AppMap.create.mockImplementation(async () => ({ uuid: idsIter.next().value }));
  Mapset.create.mockResolvedValue({
    id: 42,
    app_id: 69,
    created_at: 'created-at',
    updated_at: 'updated-at',
    user_id: 79,
  });
});
afterEach(() => {
  if (cwd) process.chdir(cwd);
});

jest.mock('@appland/common/src/telemetry');
jest.mock('@appland/client');
jest.mock('../../../src/cmds/userInteraction');

const App = jest.mocked(client.App);
const AppMap = jest.mocked(client.AppMap);
const Mapset = jest.mocked(client.Mapset);
const UI = jest.mocked(UI_);
