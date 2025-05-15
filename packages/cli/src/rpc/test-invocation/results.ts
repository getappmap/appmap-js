import { TestInvocationRpc } from '@appland/rpc';
import { RpcHandler } from '../rpc';

export function submitInvocationResults(
  args: TestInvocationRpc.SubmitResultsRequest
): Promise<TestInvocationRpc.SubmitResultsResponse> {
  // Log for now
  console.log('submitInvocationResultsHandler', args);

  return Promise.resolve({});
}

export function submitInvocationResultsHandler(): RpcHandler<
  TestInvocationRpc.SubmitResultsRequest,
  TestInvocationRpc.SubmitResultsResponse
> {
  return {
    name: TestInvocationRpc.SubmitResultFunctionName,
    handler: (args) => submitInvocationResults(args),
  };
}
