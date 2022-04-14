import startTestCases from '../action/startTestCases';
import testCasesRunning from './testCasesRunning';
import { State } from '../types/state';

// Test cases are available and configured.
export default async function testCasesAvailable(): Promise<State> {
  await startTestCases();
  return testCasesRunning;
}
