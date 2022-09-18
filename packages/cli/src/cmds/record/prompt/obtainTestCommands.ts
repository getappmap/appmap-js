import UI from '../../userInteraction';
import { TestCommand } from '../configuration';
import guessTestCommands from '../action/guessTestCommands';
import TestCaseRecording from '../testCaseRecording';
import RecordContext from '../recordContext';

export default async function obtainTestCommands({ configuration }: RecordContext): Promise<void> {
  UI.progress(``);
  UI.progress(
    `In order to record test cases, you need to provide a command that I can use to run the tests. ` +
      `If your project has many test cases, ` +
      `enter a command that will run integration, functional, system or request tests, as opposed to unit tests. ` +
      `Don't worry about how long the tests will take to run, you will specify a maximum runtime in an upcoming step.`
  );
  UI.progress(``);

  const testCommands = (await guessTestCommands()) || [];
  for (const testCommand of testCommands) {
    UI.progress(`Here's a suggested test command for your project:`);
    UI.progress(``);
    // TODO: Colorize
    UI.progress(TestCommand.toString(testCommand));
    UI.progress(``);
    if (await UI.confirm('Use this suggested test command?')) {
      configuration.setConfigOption('test_recording.test_commands', [testCommand]);
      await configuration.write();

      UI.progress(``);
      UI.progress(
        `I've written this test command to your AppMap configuration file (appmap.yml). ` +
          `The next time you run this program, it will be used automatically. You can change it in the appmap.yml ` +
          `if you want to. You can also delete it, in which case you'll be prompted again next time. And, you can also add ` +
          `additional test commands to that file.`
      );
      UI.progress(``);
      await UI.continue('Press enter to continue');
      return;
    }
  }

  let confirmed = false;
  while (!confirmed) {
    let testCommand: any;
    do {
      testCommand = (
        await UI.prompt({
          name: 'testCommand',
          type: 'input',
          message: 'Test command (without env vars):',
        })
      )['testCommand'];
    } while (!testCommand);

    const { envVars } = await UI.prompt({
      name: 'envVars',
      type: 'input',
      message: 'Environment variables:',
    });

    let env = {};
    if (envVars.toString().trim() !== '') {
      env = envVars
        .toString()
        .trim()
        .split(/\s+/)
        .reduce((acc: Record<string, string>, curr: string) => {
          const [key, value] = curr.split('=', 2);
          acc[key] = value;
          return acc;
        }, {});
    }

    UI.progress(`To run the tests, I will run the following command:`);
    UI.progress('');
    UI.progress(`${TestCaseRecording.envString(env)}${testCommand}`);
    UI.progress('');

    confirmed = await UI.confirm(`Continue with this command?`);
    if (confirmed) {
      configuration.setConfigOption('test_recording.test_commands', [
        { env, command: testCommand },
      ]);
      await configuration.write();
    }
  }
}
