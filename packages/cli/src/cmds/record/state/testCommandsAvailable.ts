import startTestCases from '../action/startTestCases';
import testCasesRunning from './testCasesRunning';
import { State } from '../types/state';
import RecordContext from '../recordContext';

// Test cases are available and configured.
export default async function testCommandsAvailable(
  recordContext: RecordContext
): Promise<State> {
  await startTestCases(recordContext);

  await recordContext.populateMaxTime();

  return testCasesRunning;
}
