import * as fs from 'fs/promises';
import * as utils from '../../../../src/utils';

import Location from '../../../../src/rpc/explain/location';
import LocationContextCollector from '../../../../src/rpc/explain/LocationContextCollector';

jest.mock('fs/promises');
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('../../../../src/utils', () => ({
  ...jest.requireActual('../../../../src/utils'),
  exists: jest.fn(),
  isFile: jest.fn(),
}));

describe('LocationContextCollector', () => {
  const sourceDirectories = ['/src', '/lib'];
  const locations: Location[] = [
    { path: 'file1.js', snippet: (contents: string) => contents.slice(0, 10) },
    { path: '/src/file2.js', snippet: (contents: string) => contents.slice(0, 10) },
    { path: '/other/file3.js', snippet: (contents: string) => contents.slice(0, 10) },
  ];

  let collector: LocationContextCollector;

  beforeEach(() => (collector = new LocationContextCollector(sourceDirectories, locations)));
  beforeEach(() => jest.resetAllMocks());

  it('initializes correctly', () => {
    expect(collector).toBeDefined();
  });

  it('handles empty locations', async () => {
    collector = new LocationContextCollector(sourceDirectories, []);
    const result = await collector.collectContext();
    expect(result.context).toEqual([]);
    expect(result.searchResponse.numResults).toBe(0);
  });

  it('handles valid locations', async () => {
    jest.spyOn(utils, 'exists').mockResolvedValue(true);
    jest.spyOn(utils, 'isFile').mockResolvedValue(true);
    jest.spyOn(fs, 'readFile').mockResolvedValue('file contents');

    const result = await collector.collectContext();
    expect(result.context.length).toBe(4);
    expect(result.context[0].content).toBe('file conte');
    expect(result.context[1].content).toBe('file conte');
    expect(result.context[2].content).toBe('file conte');
    expect(result.context[3].content).toBe('file conte');

    expect(utils.exists).toHaveBeenCalledTimes(4);
    expect(utils.exists).toHaveBeenCalledWith('/src/file1.js');
    expect(utils.exists).toHaveBeenCalledWith('/lib/file1.js');
    expect(utils.exists).toHaveBeenCalledWith('/src/file2.js');
    expect(utils.exists).toHaveBeenCalledWith('/other/file3.js');
  });

  it('handles non-file locations', async () => {
    jest.spyOn(utils, 'exists').mockResolvedValue(true);
    jest.spyOn(utils, 'isFile').mockResolvedValue(false);

    const result = await collector.collectContext();
    expect(result.context).toEqual([]);
  });

  it('handles non-existent files', async () => {
    jest.spyOn(utils, 'exists').mockResolvedValue(false);

    const result = await collector.collectContext();
    expect(result.context).toEqual([]);
  });

  it('handles file reading errors', async () => {
    jest.spyOn(utils, 'exists').mockResolvedValue(true);
    jest.spyOn(utils, 'isFile').mockResolvedValue(true);
    jest.spyOn(fs, 'readFile').mockRejectedValue(new Error('Read error'));

    const result = await collector.collectContext();
    expect(result.context).toEqual([]);
  });

  it('extracts snippets correctly', async () => {
    jest.spyOn(utils, 'exists').mockResolvedValue(true);
    jest.spyOn(utils, 'isFile').mockResolvedValue(true);
    jest.spyOn(fs, 'readFile').mockResolvedValue('file contents');

    const result = await collector.collectContext();
    expect(result.context[0].content).toBe('file conte');
  });
});
