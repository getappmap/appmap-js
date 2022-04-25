import { exists, verbose } from '../../../utils';
import { readConfigOption, TestCommand } from '../configuration';
import TestCaseRecording from '../testCaseRecording';

export default async function guessTestCommands(): Promise<
  TestCommand[] | undefined
> {
  const language = await readConfigOption('language', 'undefined');
  if (language === 'ruby') {
    const env = { APPMAP: 'true', DISABLE_SPRING: 'true' };
    const testCommandForDirectory: Record<string, string> = {
      spec: 'bundle exec rspec',
      test: 'bundle exec rake test',
    };
    const dirExists = await Promise.all(
      Object.keys(testCommandForDirectory).map(async (dir) => await exists(dir))
    );
    const testCommands = Object.keys(testCommandForDirectory)
      .filter((_, idx) => dirExists[idx])
      .map((dir) => testCommandForDirectory[dir])
      .map(
        (testCommand) =>
          ({
            env,
            command: testCommand,
          } as TestCommand)
      );

    const commandStrings = testCommands.map(
      (cmd) => `${TestCaseRecording.envString(cmd.env)}${cmd.command}`
    );
    if (verbose())
      console.log(
        `Guessed test commands for Ruby:\n${commandStrings.join('\n')}`
      );

    return testCommands;
  }
}
