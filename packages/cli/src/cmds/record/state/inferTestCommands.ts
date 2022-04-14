import { exists } from '../../../utils';
import UI from '../../userInteraction';
import { AppMapConfig, readConfig, writeConfigOption } from '../configuration';

export default async function inferTestCommands(): Promise<
  string[] | undefined
> {
  const config = await readConfig();
  if (!config) return;
  if (!config.language) return;

  if (config.language === 'ruby') {
    const testCommandForDirectory = {
      test: 'env APPMAP=true DISABLE_SPRING=true bundle exec rake test',
      rspec: 'env APPMAP=true DISABLE_SPRING=true bundle exec rspec',
    };
    const dirExists = await Promise.all(
      Object.keys(testCommandForDirectory).map(async (dir) => await exists(dir))
    );
    const testCommands = Object.keys(testCommandForDirectory)
      .filter((_, idx) => dirExists[idx])
      .map((dir) => testCommandForDirectory[dir]);

    UI.progress(`Guessing test commands for Ruby:\n${testCommands.join('\n')}`);
    await writeConfigOption('test_recording.test_commands', testCommands);

    return testCommands;
  }
}
