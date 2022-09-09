import TestCaseRecording from '../testCaseRecording';
import UI from '../../userInteraction';
import RecordContext from '../recordContext';

export default async function startTestCases(context: RecordContext) {
  const { configuration } = context;
  if (Boolean(process.stdout.isTTY)) {
    const defaultMaxTime = configuration.setting('test_recording.max_time', 30);
    let maxTime: number | undefined;
    do {
      maxTime = (
        await UI.prompt({
          type: 'input',
          name: 'maxTime',
          message:
            'Enter the maximum time (in seconds) to allow test cases to run (-1 to run forever):',
          default: defaultMaxTime,
        })
      )['maxTime'];
      maxTime = Number(maxTime);
    } while (Number.isNaN(maxTime));
    if (maxTime !== defaultMaxTime)
      configuration.setSetting('test_recording.max_time', maxTime);
    await configuration.write();
  }

  await TestCaseRecording.start(context);
}
