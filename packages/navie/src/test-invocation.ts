export type TestInvocationItem = {
  id: string;
  filePath: string;
  startLine?: number;
  endLine?: number;
  testName?: string;
};

export type TestInvocationRequest = {
  testItems: TestInvocationItem[];
  invocation: 'immediate' | 'async';
};

export type TestScheduledItem = {
  testId: string;
  testStatus: 'scheduled';
};

export type TestResultItem = {
  testId: string;
  testStatus: 'passed' | 'failed' | 'skipped';
  testDuration: number;
  testOutput: string;
  testError: string | null;
};

export type TestInvocationResponse = {
  testResults: (TestResultItem | TestScheduledItem)[];
};
