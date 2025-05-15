import { TestInvocationRpc } from '@appland/rpc';
import { submitInvocationResults } from '../../../../src/rpc/test-invocation/results';

describe('test invocation results', () => {
  it('processes test results submission', async () => {
    const results: TestInvocationRpc.SubmitResultsRequest = {
      results: [
        {
          id: 'test1',
          testStatus: 'passed',
          testDuration: 100,
          testOutput: 'Test passed successfully',
          testError: null,
        },
        {
          id: 'test2',
          testStatus: 'failed',
          testDuration: 50,
          testOutput: 'Test failed',
          testError: 'Expected true to be false',
        },
      ],
    };

    const response = await submitInvocationResults(results);
    expect(response).toEqual({});
  });
});
