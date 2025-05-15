export namespace TestInvocationRpc {
  export const GetRequestsFunctionName = 'getInvocationRequests';
  export const SubmitResultFunctionName = 'submitInvocationResults';

  export type GetRequestsOptions = {};

  export type GetRequestsResult = {
    id: string;
    filePath: string;
  };

  export type TestInvocationResult = {
    id: string;
    testStatus: 'passed' | 'failed' | 'skipped';
    testDuration: number;
    testOutput: string;
    testError: string | null;
  };

  export type SubmitResultsRequest = {
    results: TestInvocationResult[];
  };

  export type SubmitResultsResponse = {};
}
