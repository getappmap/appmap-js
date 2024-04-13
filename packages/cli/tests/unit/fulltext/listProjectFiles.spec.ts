import listProjectFiles, { isBinaryFile } from '../../../src/fulltext/listProjectFiles';
import * as fs from 'fs';
import * as fsp from 'fs/promises';

jest.mock('fs/promises', () => ({
  readdir: jest.fn(),
}));

describe('listProjectFiles', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('lists all non-binary, non-ignored files in a directory', async () => {
    const mockFiles = [
      { name: 'index.js', isFile: () => true, isDirectory: () => false } as unknown as fs.Dirent,
      { name: 'logo.png', isFile: () => true, isDirectory: () => false } as unknown as fs.Dirent,
      { name: 'utils', isFile: () => false, isDirectory: () => true } as unknown as fs.Dirent,
      // Pretend utils directory contains a single file
      { name: 'helper.js', isFile: () => true, isDirectory: () => false } as unknown as fs.Dirent,
    ];

    jest.mocked(fsp.readdir).mockImplementation((dir: fs.PathLike) => {
      if (dir.toString() === '/fake/directory/utils') return Promise.resolve([mockFiles[3]]);
      else if (dir.toString() === '/fake/directory') return Promise.resolve(mockFiles.slice(0, 3));
      else return Promise.resolve([]);
    });

    const files = await listProjectFiles('/fake/directory');
    expect(files).toContain('/fake/directory/index.js');
    expect(files).toContain('/fake/directory/utils/helper.js');
    expect(files).not.toContain('/fake/directory/logo.png');
    expect(fsp.readdir).toHaveBeenCalledTimes(2); // Initial dir + utils
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
    jest.mocked(fsp.readdir).mockImplementation((dir: fs.PathLike) => {
      directoriesRead.push(dir.toString());

      if (dir.toString() === '/fake/directory') return Promise.resolve(mockDirectories);
      else return Promise.resolve([]);
    });

    const files = await listProjectFiles('/fake/directory');
    expect(files).toEqual([]);
    expect(directoriesRead).toEqual(['/fake/directory', '/fake/directory/src']);
  });

  it('identifies binary files correctly', () => {
    expect(isBinaryFile('image.png')).toBe(true);
    expect(isBinaryFile('document.pdf')).toBe(true);
    expect(isBinaryFile('script.js')).toBe(false);
  });
});
