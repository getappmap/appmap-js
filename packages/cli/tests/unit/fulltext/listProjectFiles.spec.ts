import listProjectFiles from '../../../src/fulltext/listProjectFiles';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import { join } from 'path';

jest.mock('fs/promises', () => ({
  readdir: jest.fn(),
}));

describe('listProjectFiles', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('lists all files in a directory', async () => {
    const mockFiles = [
      { name: 'index.js', isFile: () => true, isDirectory: () => false } as unknown as fs.Dirent,
      { name: 'logo.png', isFile: () => true, isDirectory: () => false } as unknown as fs.Dirent,
      { name: 'utils', isFile: () => false, isDirectory: () => true } as unknown as fs.Dirent,
      // Pretend utils directory contains a single file
      { name: 'helper.js', isFile: () => true, isDirectory: () => false } as unknown as fs.Dirent,
    ];

    const baseDir = join('fake', 'directory');
    jest.mocked(fsp.readdir).mockImplementation((dir: fs.PathLike) => {
      if (dir.toString() === join(baseDir, 'utils')) return Promise.resolve([mockFiles[3]]);
      else if (dir.toString() === baseDir) return Promise.resolve(mockFiles.slice(0, 3));
      else return Promise.resolve([]);
    });

    const files = await listProjectFiles(baseDir);
    expect(files).toContain('index.js');
    expect(files).toContain(join('utils', 'helper.js'));
    expect(fsp.readdir).toHaveBeenCalledTimes(2); // baseDir + utils
  });

  it('ignores directories specified in IGNORE_DIRECTORIES', async () => {
    const mockDirectories = [
      {
        name: 'node_modules',
        isFile: () => false,
        isDirectory: () => true,
      } as unknown as fs.Dirent,
      { name: 'src', isFile: () => false, isDirectory: () => true } as unknown as fs.Dirent,
    ];

    const directoriesRead = new Array<string>();
    const baseDir = join('fake', 'directory');
    jest.mocked(fsp.readdir).mockImplementation((dir: fs.PathLike) => {
      directoriesRead.push(dir.toString());

      if (dir.toString() === baseDir) return Promise.resolve(mockDirectories);
      else return Promise.resolve([]);
    });

    const files = await listProjectFiles(baseDir);
    expect(files).toEqual([]);
    expect(directoriesRead).toEqual([baseDir, join(baseDir, 'src')]);
  });
});
