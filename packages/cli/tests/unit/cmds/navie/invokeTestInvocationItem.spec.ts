import { TestInvocation } from '@appland/navie';
import { exec } from 'child_process';
import { existsSync } from 'fs';
import invokeTestInvocationItem, {
  TEST_NAME_SYMBOL,
} from '../../../../src/cmds/navie/invokeTestInvocationItem';
import collectAppMapConfigByPath from '../../../../src/lib/collectAppMapConfigByPath';
import configuration from '../../../../src/rpc/configuration';
import { AppMapConfig } from '../../../../src/lib/loadAppMapConfig';

jest.mock('child_process');
jest.mock('fs');
jest.mock('../../../../src/rpc/configuration');
jest.mock('../../../../src/lib/collectAppMapConfigByPath');

describe('invokeTestInvocationItem', () => {
  const mockConfig = {
    appmapDirectories: jest.fn().mockResolvedValue([{ directory: '/test/project' }]),
  };

  const mockAppMapConfig = {
    test_commands: [
      {
        language: 'javascript',
        command: `jest ${TEST_NAME_SYMBOL}`,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (configuration as jest.Mock).mockReturnValue(mockConfig);
    (collectAppMapConfigByPath as jest.Mock).mockImplementation((appMapDirectories: string[]) => {
      const result = new Map<string, AppMapConfig>();
      for (const dir of appMapDirectories) {
        if (dir === '/test/project') {
          result.set(dir, mockAppMapConfig as unknown as AppMapConfig);
        }
      }
      return result;
    });
    // Used to locate the package.json file
    (existsSync as jest.Mock).mockReturnValue(true);
    (exec as unknown as jest.Mock).mockImplementation((cmd, opts, callback) => {
      callback(null, 'test output', '');
    });
  });

  it('executes JavaScript test command synchronously', async () => {
    const testItem: TestInvocation.TestInvocationItem = {
      id: 'test1',
      filePath: '/test/project/src/test.ts',
    };

    const result = await invokeTestInvocationItem('sync', testItem);

    expect(exec).toHaveBeenCalledWith(
      'jest test.ts',
      { cwd: '/test/project/src' },
      expect.any(Function)
    );
    expect(result).toEqual({
      succeeded: true,
      stdout: 'test output',
      stderr: '',
    });
  });

  it('handles command execution errors', async () => {
    (exec as unknown as jest.Mock).mockImplementation((cmd, opts, callback) => {
      callback(new Error('Command failed'), '', 'error output');
    });

    const testItem: TestInvocation.TestInvocationItem = {
      id: 'test1',
      filePath: '/test/project/src/test.ts',
    };

    const result = await invokeTestInvocationItem('sync', testItem);

    expect(result).toEqual({
      succeeded: false,
      error: 'Command failed',
    });
  });

  it('handles async invocation', async () => {
    const testItem: TestInvocation.TestInvocationItem = {
      id: 'test1',
      filePath: '/test/project/src/test.ts',
    };

    const result = await invokeTestInvocationItem('async', testItem);

    expect(exec).toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('returns early if no AppMap config is found', async () => {
    mockConfig.appmapDirectories.mockResolvedValueOnce([]);

    const testItem: TestInvocation.TestInvocationItem = {
      id: 'test1',
      filePath: 'test.ts',
    };

    const result = await invokeTestInvocationItem('sync', testItem);

    expect(exec).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('returns early if no test commands are found', async () => {
    const config: AppMapConfig = { test_commands: [] } as unknown as AppMapConfig;

    mockConfig.appmapDirectories.mockResolvedValueOnce([{ directory: '/test/project', config }]);
    (collectAppMapConfigByPath as jest.Mock).mockImplementation((appMapDirectories: string[]) => {
      const result = new Map<string, AppMapConfig>();
      result.set(appMapDirectories[0], config as unknown as AppMapConfig);
      return result;
    });

    const testItem: TestInvocation.TestInvocationItem = {
      id: 'test1',
      filePath: 'test.ts',
    };

    const result = await invokeTestInvocationItem('sync', testItem);

    expect(exec).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('handles unsupported file extensions', async () => {
    const testItem: TestInvocation.TestInvocationItem = {
      id: 'test1',
      filePath: 'test.unknown',
    };

    const result = await invokeTestInvocationItem('sync', testItem);

    expect(exec).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});
