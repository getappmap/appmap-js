import { exists, verbose } from '../../../utils';
import { readConfigOption, TestCommand } from '../configuration';
import TestCaseRecording from '../testCaseRecording';

const RubyEnv = { APPMAP: 'true', DISABLE_SPRING: 'true' };

const TestCommands: Record<string, TestCommand> = {
  'Gemfile/spec': {
    env: RubyEnv,
    command: 'bundle exec rspec',
  },
  'Gemfile/test': {
    env: RubyEnv,
    command: 'bundle exec rake test',
  },
  'pom.xml': {
    command: 'mvn test',
    env: {},
  },
};

export default async function guessTestCommands(): Promise<
  TestCommand[] | undefined
> {
  const pathExists = await Promise.all(
    Object.keys(TestCommands).map(async (path) => await exists(path))
  );
  return Object.keys(TestCommands)
    .filter((_, idx) => pathExists[idx])
    .map((path) => TestCommands[path]);
}
