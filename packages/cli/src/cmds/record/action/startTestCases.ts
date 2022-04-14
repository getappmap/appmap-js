import TestCaseRecording from '../testCaseRecording';
import testCasesRunning from '../state/testCasesRunning';

export default async function startTestCases() {
  await TestCaseRecording.start();
  return testCasesRunning;
}
