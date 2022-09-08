import UI from '../../userInteraction';
import { TestCommand } from '../configuration';
import RecordContext from '../recordContext';
import TestCaseRecording from '../testCaseRecording';

export default async function areTestCasesConfigured({
  configuration,
}: RecordContext): Promise<boolean> {
  let testCommands: TestCommand[] | undefined = configuration.configOption(
    'test_recording.test_commands',
    []
  ) as TestCommand[];

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
      configuration.setConfigOption('test_recording.test_commands', []);
      await configuration.write();
    }

    return useTestCommands;
  }

  return false;
}
