import { TestInvocationRequest, TestInvocationResponse } from '../test-invocation';

export default class InvokeTestsService {
  constructor(
    public readonly testFn: (data: TestInvocationRequest) => Promise<TestInvocationResponse>
  ) {}

  async invokeTests(request: TestInvocationRequest): Promise<TestInvocationResponse> {
    return await this.testFn(request);
  }
}
