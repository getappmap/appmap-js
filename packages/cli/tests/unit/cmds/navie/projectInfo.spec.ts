import collectProjectInfos from '../../../../src/cmds/navie/projectInfo';
import { getDiffLog, getWorkingDiff } from '../../../../src/lib/git';
import configuration from '../../../../src/rpc/configuration';
import { collectStats } from '../../../../src/rpc/appmap/stats';

// Mock the dependencies
jest.mock('../../../../src/lib/git');
jest.mock('../../../../src/rpc/configuration');
jest.mock('../../../../src/rpc/appmap/stats');

describe('collectProjectInfos', () => {
  const singleProjectConfiguration = {
    projectDirectories: ['/test/project'],
    appmapDirectories: jest.fn().mockResolvedValue([
      {
        directory: '/test/project',
        appmapConfig: {},
      },
    ]),
  };

  const singleProjectStats = [
    {
      name: 'test-project',
      directory: '/test/project',
      packages: ['test-package'],
      classes: ['TestClass'],
      routes: ['/test'],
      tables: ['users'],
      numAppMaps: 1,
    },
  ];

  beforeEach(() => jest.clearAllMocks());

  describe('for a single directory', () => {
    it('should collect project info without diff', async () => {
      (configuration as jest.Mock).mockReturnValue(singleProjectConfiguration);
      (collectStats as jest.Mock).mockResolvedValue(singleProjectStats);

      const result = await collectProjectInfos('vscode');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('directory', '/test/project');
      expect(result[0]).toHaveProperty('appmapStats');
      expect(result[0]).toHaveProperty('codeEditor', { name: 'vscode' });
      expect(result[0]).not.toHaveProperty('diff');
    });

    it('should collect project info with diff', async () => {
      (configuration as jest.Mock).mockReturnValue(singleProjectConfiguration);
      (collectStats as jest.Mock).mockResolvedValue(singleProjectStats);
      (getWorkingDiff as jest.Mock).mockResolvedValue('working diff');
      (getDiffLog as jest.Mock).mockResolvedValue('diff log');

      const result = await collectProjectInfos('vscode', {
        type: 'projectInfo',
        includeDiff: true,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('directory', '/test/project');
      expect(result[0]).toHaveProperty('appmapStats');
      expect(result[0]).toHaveProperty('codeEditor', { name: 'vscode' });
      expect(result[0]).toHaveProperty('diff', 'working diff\n\ndiff log');
    });

    it('should collect project info with diff and base branch', async () => {
      (configuration as jest.Mock).mockReturnValue(singleProjectConfiguration);
      (collectStats as jest.Mock).mockResolvedValue(singleProjectStats);
      (getWorkingDiff as jest.Mock).mockResolvedValue('working diff');
      (getDiffLog as jest.Mock).mockResolvedValue('diff log with base');

      const result = await collectProjectInfos('vscode', {
        type: 'projectInfo',
        includeDiff: true,
        baseBranch: 'main',
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('directory', '/test/project');
      expect(result[0]).toHaveProperty('appmapStats');
      expect(result[0]).toHaveProperty('codeEditor', { name: 'vscode' });
      expect(result[0]).toHaveProperty('diff', 'working diff\n\ndiff log with base');
      expect(getDiffLog).toHaveBeenCalledWith(undefined, 'main', '/test/project');
    });
  });

  describe('for multiple directories', () => {
    const multipleProjectStats = [
      {
        name: 'test-project1',
        directory: '/test/project1',
        packages: ['test-package'],
        classes: ['TestClass'],
        routes: ['/test'],
        tables: ['users'],
        numAppMaps: 1,
      },
      {
        name: 'test-project2',
        directory: '/test/project2',
        packages: ['test-package'],
        classes: ['TestClass'],
        routes: ['/test'],
        tables: ['users'],
        numAppMaps: 1,
      },
    ];

    const multipleProjectConfiguration = {
      projectDirectories: ['/test/project1', '/test/project2'],
      appmapDirectories: jest.fn().mockResolvedValue([
        {
          directory: '/test/project1',
          appmapConfig: {},
        },
        {
          directory: '/test/project2',
          appmapConfig: {},
        },
      ]),
    };

    it('should handle multiple project directories', async () => {
      (configuration as jest.Mock).mockReturnValue(multipleProjectConfiguration);
      (collectStats as jest.Mock).mockResolvedValue(multipleProjectStats);

      const result = await collectProjectInfos('vscode');

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('directory', '/test/project1');
      expect(result[1]).toHaveProperty('directory', '/test/project2');
    });
  });
});
