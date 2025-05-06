import InvokeTestsService from '../../src/services/invoke-tests-service';
import { TestInvocationRequest, TestInvocationResponse } from '../../src/test-invocation';

describe('InvokeTestsService', () => {
  let testFn: jest.Mock;
  let service: InvokeTestsService;

  beforeEach(() => {
    testFn = jest.fn();
    service = new InvokeTestsService(testFn);
  });

  describe('invokeTests', () => {
    it('calls the provided test function with the request and returns its response', async () => {
      const request: TestInvocationRequest = {
        testItems: [
          {
            id: 'test-1',
            filePath: '/path/to/test.ts',
            startLine: 1,
            endLine: 10,
            testName: 'should do something',
          },
        ],
        invocation: 'immediate',
      };

      const expectedResponse: TestInvocationResponse = {
        testResults: [
          {
            testId: 'test-1',
            testStatus: 'passed',
            testDuration: 100,
            testOutput: 'Test passed',
            testError: null,
          },
        ],
      };

      testFn.mockResolvedValue(expectedResponse);

      const result = await service.invokeTests(request);

      expect(testFn).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });
  });
});