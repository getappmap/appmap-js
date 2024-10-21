import * as fs from 'fs';
import * as fsp from 'fs/promises';
import { join } from 'path';
import * as childProcess from 'node:child_process';
import type { ChildProcess } from 'node:child_process';

import listProjectFiles, { listGitProjectFiles } from '../src/project-files';

jest.mock('fs/promises', () => ({
  readdir: jest.fn(),
}));
jest.mock('node:child_process');

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

describe('listGitProjectFiles', () => {
  const mockDirectory = '/mock/directory';

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Setup default return values for mocked functions
    jest.mocked(childProcess.exec).mockImplementation((cmd: string, _options, callback) => {
      const cb = callback as (_: unknown, __: unknown) => void;
      if (cmd.includes('ls-files')) {
        cb(null, { stdout: 'file1.js' });
      } else if (cmd.includes('status --porcelain')) {
        cb(null, {
          stdout: `
?? newFile.ts
M  stagedFile.js
 M unstagedFile.js
`,
        });
      } else {
        cb(null, { stdout: '' });
      }

      return {} as ChildProcess;
    });
  });

  it('includes git-managed files, including modified files, as well as untracked', async () => {
    const files = await listGitProjectFiles(mockDirectory);

    expect(files.length).toBe(4);
    expect(files).toContain('file1.js');
    expect(files).toContain('newFile.ts');
    expect(files).toContain('stagedFile.js');
    expect(files).toContain('unstagedFile.js');
  });
});
