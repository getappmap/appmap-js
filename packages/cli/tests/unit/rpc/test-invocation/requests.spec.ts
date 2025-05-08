import { TestInvocation } from '@appland/navie';
import {
  enqueueTestInvocationItem,
  getInvocationRequests,
} from '../../../../src/rpc/test-invocation/requests';

describe('test invocation requests', () => {
  beforeEach(() => {
    // Clear any pending items between tests
    getInvocationRequests({});
  });

  it('handles enqueueing and retrieving test invocation items', () => {
    const testItem1: TestInvocation.TestInvocationItem = {
      id: 'test1',
      filePath: '/path/to/test1.spec.ts',
      startLine: 10,
      endLine: 20,
      testName: 'should do something',
    };

    const testItem2: TestInvocation.TestInvocationItem = {
      id: 'test2',
      filePath: '/path/to/test2.spec.ts',
    };

    enqueueTestInvocationItem(testItem1);
    enqueueTestInvocationItem(testItem2);

    const requests = getInvocationRequests({});
    expect(requests).toEqual([
      { id: 'test1', filePath: '/path/to/test1.spec.ts' },
      { id: 'test2', filePath: '/path/to/test2.spec.ts' },
    ]);

    // Subsequent call should return empty array as queue is cleared
    expect(getInvocationRequests({})).toEqual([]);
  });
});
