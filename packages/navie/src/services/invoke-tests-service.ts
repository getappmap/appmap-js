import {
  TestInvocationProvider,
  TestInvocationRequest,
  TestInvocationResponse,
} from '../test-invocation';

export default class InvokeTestsService {
  constructor(public readonly testFn: TestInvocationProvider) {}

  async invokeTests(request: TestInvocationRequest): Promise<TestInvocationResponse> {
    return await this.testFn(request);
  }
}
