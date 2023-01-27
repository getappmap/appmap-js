import { handler } from '../../../src/cmds/upload';

import path from 'node:path';
import fs from 'node:fs/promises';

import * as client from '@appland/client';
import UI_ from '../../../src/cmds/userInteraction';
import * as utils from '../../../src/utils';

describe('upload command', () => {
  it('uploads appmaps', async () => {
    expect.assertions(3);

    await handler({ appmapDir });

    expect(UI.success).toHaveBeenCalledWith(
      'Created mapset https://appmap.test/applications/69/mapsets/42 with 3 AppMaps'
    );
    expect(AppMap.create).toHaveBeenCalledTimes(3);
    expect(Mapset.create).toHaveBeenCalledWith('sample_app_6th_ed', mapIds, expect.anything());
  });

  it('allows overriding the app name', async () => {
    expect.assertions(1);
    await handler({ appmapDir, app: 'test-app' });
    expect(Mapset.create).toHaveBeenCalledWith('test-app', mapIds, expect.anything());
  });

  it('aborts in case of an error while checking', async () => {
    expect.assertions(5);

    jest.spyOn(fs, 'readFile').mockRejectedValueOnce(new Error('test error while reading'));

    await expect(handler({ appmapDir })).rejects.toThrowError();

    expect(fs.readFile).toHaveBeenCalledTimes(1);
    expect(UI.success).not.toHaveBeenCalled();
    expect(AppMap.create).not.toHaveBeenCalled();
    expect(Mapset.create).not.toHaveBeenCalled();
  });

  it('aborts in case of an error while uploading', async () => {
    expect.assertions(4);

    AppMap.create.mockRejectedValue(new Error('test error while uploading'));

    await expect(handler({ appmapDir })).rejects.toThrowError();

    expect(UI.success).not.toHaveBeenCalled();
    expect(AppMap.create).toHaveBeenCalledTimes(1);
    expect(Mapset.create).not.toHaveBeenCalled();
  });

  it('aborts in case no appmaps found', async () => {
    expect.assertions(4);

    jest.spyOn(utils, 'listAppMapFiles').mockResolvedValue();

    await expect(handler({ appmapDir })).rejects.toThrowError();

    expect(UI.success).not.toHaveBeenCalled();
    expect(AppMap.create).not.toHaveBeenCalled();
    expect(Mapset.create).not.toHaveBeenCalled();
  });
});

const mapIds = ['foo', 'bar', 'baz'];

beforeEach(() => {
  jest.restoreAllMocks();
  jest.resetAllMocks();

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

const appmapDir = path.join(__dirname, '../', 'fixtures', 'stats');

jest.mock('../../../src/telemetry');
jest.mock('@appland/client');
jest.mock('../../../src/cmds/userInteraction');

const AppMap = jest.mocked(client.AppMap);
const Mapset = jest.mocked(client.Mapset);
const UI = jest.mocked(UI_);
