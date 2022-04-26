import UI from '../../userInteraction';
import {
  readConfigOption,
  TestCommand,
  writeConfigOption,
} from '../configuration';
import TestCaseRecording from '../testCaseRecording';

export default async function areTestCasesConfigured(): Promise<boolean> {
  let testCommands: TestCommand[] | undefined = (await readConfigOption(
    'test_recording.test_commands',
    []
  )) as TestCommand[];

  if (testCommands && testCommands.length > 0) {
    UI.progress(
      `The following test commands were provided by your AppMap configuration (appmap.yml):`
    );
    UI.progress(``);
    for (const testCommand of testCommands) {
      testCommand.env ||= {};
      UI.progress(
        `${TestCaseRecording.envString(testCommand.env)}${testCommand.command}`
      );
    }
    UI.progress(``);

    const { useTestCommands } = await UI.prompt({
      name: 'useTestCommands',
      type: 'confirm',
      message: 'Use these test commands?',
    });

    if (!useTestCommands) {
      await writeConfigOption('test_recording.test_commands', []);
    }

    return useTestCommands;
  }

  return false;
}
