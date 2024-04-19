import * as executeCommandModule from '../../../src/lib/executeCommand';
import * as utilsModule from '../../../src/utils';
import { isBinaryFile } from '../../../src/fulltext/listProjectFiles';
import listGitProjectFiles from '../../../src/fulltext/listGitProjectFIles';

// Mock dependencies
jest.mock('../../../src/lib/executeCommand');
jest.mock('../../../src/utils', () => ({
  ...jest.requireActual('../../../src/utils'),
  isFile: jest.fn(),
}));
jest.mock('../../../src/fulltext/listProjectFiles', () => ({
  isBinaryFile: jest.fn(),
}));

describe('listGitProjectFiles', () => {
  const mockDirectory = '/mock/directory';

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Setup default return values for mocked functions
    jest.mocked(executeCommandModule.executeCommand).mockImplementation(async (cmd) => {
      if (cmd.includes('ls-files')) {
        return 'file1.js\nfile2.png';
      }
      if (cmd.includes('status --porcelain')) {
        return '?? newFile.ts\nM modifiedFile.js';
      }
      return '';
    });
    jest.mocked(utilsModule.isFile).mockResolvedValue(true);
    jest
      .mocked(isBinaryFile)
      .mockImplementation((fileName) => !fileName.endsWith('.js') && !fileName.endsWith('.ts'));
  });

  it('includes non-binary git-managed files and filters out binary and unmanaged files', async () => {
    const files = await listGitProjectFiles(mockDirectory);

    expect(files).toContain('file1.js');
    expect(files).toContain('newFile.ts');
    expect(files).toContain('modifiedFile.js');
    expect(files).not.toContain('file2.png'); // filter out binary file
  });
});
