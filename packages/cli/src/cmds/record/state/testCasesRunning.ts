import { readSetting } from '../configuration';
import TestCaseRecording from '../testCaseRecording';
import { State } from '../types/state';
import testCasesComplete from './testCasesComplete';

export default async function testCasesRunning(): Promise<State> {
  const maxTime = (await readSetting('test_recording.max_time', -1)) as number;
  await TestCaseRecording.waitFor(maxTime === -1 ? undefined : maxTime);

  return testCasesComplete;
}
