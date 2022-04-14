import { exists } from '../../../utils';
import { AppMapConfig } from '../configuration';

export default async function inferTestCommands(
  config: AppMapConfig
): Promise<string[] | undefined> {
  if (!config.language)
    throw new Error(
      `Configure 'language' in AppMap config file before proceeding.`
    );

  if (config.language === 'ruby') {
    const testCommandForDirectory = {
      test: 'bundle exec rake test',
      rspec: 'bundle exec rspec',
    };
    const dirExists = await Promise.all(
      Object.keys(testCommandForDirectory).map(async (dir) => await exists(dir))
    );
    return Object.keys(testCommandForDirectory)
      .filter((_, idx) => dirExists[idx])
      .map((dir) => testCommandForDirectory[dir]);
  }
}
