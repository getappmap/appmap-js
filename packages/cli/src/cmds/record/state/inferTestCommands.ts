import { exists } from '../../../utils';
import UI from '../../userInteraction';
import {
  AppMapConfig,
  readConfig,
  TestCommand,
  writeConfigOption,
} from '../configuration';

export default async function inferTestCommands(): Promise<
  TestCommand[] | undefined
> {
  const config = await readConfig();
  if (!config) return;
  if (!config.language) return;

  if (config.language === 'ruby') {
    const env = { APPMAP: 'true', DISABLE_SPRING: 'true' };
    const testCommandForDirectory: Record<string, string> = {
      rspec: 'bundle exec rspec',
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

    UI.progress(`Guessing test commands for Ruby:\n${testCommands.join('\n')}`);
    await writeConfigOption('test_recording.test_commands', testCommands);

    return testCommands;
  }
}
