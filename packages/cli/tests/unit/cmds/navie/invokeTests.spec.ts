import { TestInvocation } from '@appland/navie';
import invokeTests, { InvocationStrategy } from '../../../../src/cmds/navie/invokeTests';
import invokeTestInvocationItem from '../../../../src/cmds/navie/invokeTestInvocationItem';

// Add mock at the top level
jest.mock('../../../../src/cmds/navie/invokeTestInvocationItem');

describe('invokeTests', () => {
  describe('RPC invocation strategy', () => {
    const invocationStrategy = InvocationStrategy.RPC;

    it('processes async test invocation requests', async () => {
      const request: TestInvocation.TestInvocationRequest = {
        testItems: [
          {
            id: 'test1',
            filePath: '/path/to/test1.spec.ts',
            startLine: 10,
            endLine: 20,
            testName: 'should do something',
          },
          {
            id: 'test2',
            filePath: '/path/to/test2.spec.ts',
          },
        ],
        invocation: 'async',
      };

      const response = await invokeTests(invocationStrategy, request);
      expect(response).toEqual({
        testResults: [],
      });
    });

    it('rejects sync invocation requests', async () => {
      const request: TestInvocation.TestInvocationRequest = {
        testItems: [
          {
            id: 'test1',
            filePath: '/path/to/test.spec.ts',
          },
        ],
        invocation: 'sync',
      };

      const invocationStrategy = InvocationStrategy.RPC;
      await expect(invokeTests(invocationStrategy, request)).rejects.toThrow(
        'Only async invocation is supported'
      );
    });
  });

  describe('SHELL invocation strategy', () => {
    const invocationStrategy = InvocationStrategy.SHELL;

    beforeEach(() => {
      jest.clearAllMocks();
      // Add mock implementation
      (invokeTestInvocationItem as jest.Mock).mockResolvedValue(undefined);
    });

    it('calls invokeTestInvocationItem with correct parameters', async () => {
      const testItem = {
        id: 'test1',
        filePath: '/path/to/test1.spec.ts',
        startLine: 10,
        endLine: 20,
        testName: 'should do something',
      };

      const request: TestInvocation.TestInvocationRequest = {
        testItems: [testItem],
        invocation: 'sync',
      };

      await invokeTests(invocationStrategy, request);

      expect(invokeTestInvocationItem).toHaveBeenCalledWith('sync', testItem);
      expect(invokeTestInvocationItem).toHaveBeenCalledTimes(1);
    });
  });
});
