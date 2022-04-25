import TestCaseRecording from '../testCaseRecording';
import UI from '../../userInteraction';
import { readSetting, writeSetting } from '../configuration';

export default async function startTestCases() {
  if (Boolean(process.stdout.isTTY)) {
    const defaultMaxTime = await readSetting('test_recording.max_time', 30);
    const { maxTime } = await UI.prompt({
      type: 'input',
      name: 'maxTime',
      message:
        'Enter the maximum time (in seconds) to allow test cases to run (-1 to run forever):',
      default: defaultMaxTime,
    });
    if (maxTime !== defaultMaxTime)
      await writeSetting('test_recording.max_time', maxTime);
  }

  await TestCaseRecording.start();
}
