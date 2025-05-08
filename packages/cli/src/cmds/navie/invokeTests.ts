import { TestInvocation } from '@appland/navie';
import { enqueueTestInvocationItem } from '../../rpc/test-invocation/requests';
import invokeTestInvocationItem from './invokeTestInvocationItem';

export enum InvocationStrategy {
  SHELL = 'shell',
  RPC = 'rpc',
}

export default async function invokeTests(
  invocationStrategy: InvocationStrategy,
  request: TestInvocation.TestInvocationRequest
): Promise<TestInvocation.TestInvocationResponse> {
  for (const item of request.testItems) {
    console.log(`Invoking test ${item.filePath} (${item.id})`);

    if (item.startLine && item.endLine)
      console.log(`Line range is given as ${item.startLine} to ${item.endLine}`);

    if (item.testName) console.log(`Test name is given as ${item.testName}`);

    console.log(`Enqueuing test item ${item.id} for async invocation`);

    if (invocationStrategy === InvocationStrategy.SHELL) {
      console.log(`Invoking test item ${item.id} using shell command`);
      await invokeTestInvocationItem(request.invocation, item);
    } else if (invocationStrategy === InvocationStrategy.RPC) {
      console.log(`Invoking test item ${item.id} using RPC`);

      // Handle async invocation only, for now
      if (request.invocation !== 'async') throw new Error('Only async invocation is supported');

      enqueueTestInvocationItem(item);
    } else {
      throw new Error(`Unknown invocation strategy: ${invocationStrategy}`);
    }
  }

  return Promise.resolve({
    testResults: [],
  });
}
