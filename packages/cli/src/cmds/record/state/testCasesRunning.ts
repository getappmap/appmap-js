import TestCaseRecording from '../testCaseRecording';
import { State } from '../types/state';
import testCasesComplete from './testCasesComplete';

export default async function testCasesRunning(): Promise<State> {
  await TestCaseRecording.waitFor();

  return testCasesComplete;
}
