import { TestInvocation } from '@appland/navie';
import { enqueueTestInvocationItem } from '../../rpc/test-invocation/requests';

export default async function invokeTests(
  request: TestInvocation.TestInvocationRequest
): Promise<TestInvocation.TestInvocationResponse> {
  // Handle async invocation only, for now
  if (request.invocation !== 'async') throw new Error('Only async invocation is supported');

  for (const item of request.testItems) {
    console.log(`Invoking test ${item.filePath} (${item.id})`);

    if (item.startLine && item.endLine)
      console.log(`Line range is given as ${item.startLine} to ${item.endLine}`);

    if (item.testName) console.log(`Test name is given as ${item.testName}`);

    console.log(`Enqueuing test item ${item.id} for async invocation`);
    enqueueTestInvocationItem(item);
  }

  return Promise.resolve({
    testResults: [],
  });
}
