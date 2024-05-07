import * as utilsModule from '../../../src/utils';
import listGitProjectFiles from '../../../src/fulltext/listGitProjectFIles';
import * as childProcess from 'node:child_process';
import type { ChildProcess } from 'node:child_process';

// Mock dependencies
jest.mock('node:child_process');
jest.mock('../../../src/utils', () => ({
  ...jest.requireActual('../../../src/utils'),
  isFile: jest.fn(),
}));

describe('listGitProjectFiles', () => {
  const mockDirectory = '/mock/directory';

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Setup default return values for mocked functions
    jest.mocked(childProcess.exec).mockImplementation((cmd: string, _options, callback) => {
      const cb = callback as (_: unknown, __: unknown) => void;
      if (cmd.includes('ls-files')) {
        cb(null, { stdout: 'file1.js\nfile2.png' });
      } else if (cmd.includes('status --porcelain')) {
        cb(null, {
          stdout: '?? newFile.ts\nM modifiedFile.js',
        });
      } else {
        cb(null, { stdout: '' });
      }

      return {} as ChildProcess;
    });
    jest.mocked(utilsModule.isFile).mockResolvedValue(true);
  });

  it('includes non-binary git-managed files and filters out unmanaged files', async () => {
    const files = await listGitProjectFiles(mockDirectory);

    expect(files).toContain('file1.js');
    expect(files).toContain('newFile.ts');
    expect(files).toContain('modifiedFile.js');
  });
});
