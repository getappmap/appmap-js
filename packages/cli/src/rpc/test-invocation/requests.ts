import { TestInvocationRpc } from '@appland/rpc';
import { RpcHandler } from '../rpc';
import { TestInvocation } from '@appland/navie';

let pendingInvocationItems: TestInvocation.TestInvocationItem[] = [];

export function enqueueTestInvocationItem(request: TestInvocation.TestInvocationItem): void {
  pendingInvocationItems.push(request);
}

export function getInvocationRequests(
  _args: TestInvocationRpc.GetRequestsOptions
): TestInvocationRpc.GetRequestsResult[] {
  const result = [...pendingInvocationItems];
  pendingInvocationItems = [];

  return result.map((item) => ({
    id: item.id,
    filePath: item.filePath,
  }));
}

export function getInvocationRequestsHandler(): RpcHandler<
  TestInvocationRpc.GetRequestsOptions,
  TestInvocationRpc.GetRequestsResult[]
> {
  return {
    name: TestInvocationRpc.GetRequestsFunctionName,
    handler: (args) => getInvocationRequests(args),
  };
}
