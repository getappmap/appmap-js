import areTestCasesConfigured from '../test/areTestCasesConfigured';
import { State } from '../types/state';
import abort from './abort';
import testCasesAvailable from './testCasesAvailable';

// This is the initial state of test case recording. From here, the record command is
// configured by the user and executed.
export default async function test(): Promise<State> {
  if (await areTestCasesConfigured()) {
    return testCasesAvailable;
  } else {
    console.warn(
      'No test cases are configured, and test case commands cannot be inferred'
    );
    return abort;
  }
}
