import { TestInvocation } from '@appland/navie';
import invokeTests from '../../../../src/cmds/navie/invokeTests';

describe('invokeTests', () => {
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

    const response = await invokeTests(request);
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

    await expect(invokeTests(request)).rejects.toThrow('Only async invocation is supported');
  });
});
