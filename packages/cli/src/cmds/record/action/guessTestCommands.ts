import { cwd } from 'process';
import { exists, verbose } from '../../../utils';
import { readConfigOption, TestCommand } from '../configuration';

const RubyEnv = { APPMAP: 'true', DISABLE_SPRING: 'true' };

type TestCommandGuess = {
  paths: string[];
  command: TestCommand;
};

const TestCommands: TestCommandGuess[] = [
  {
    paths: ['Gemfile', 'spec'],
    command: {
      env: RubyEnv,
      command: 'bundle exec rspec',
    },
  },
  {
    paths: ['Gemfile', 'test'],
    command: {
      env: RubyEnv,
      command: 'bundle exec rake test',
    },
  },
  {
    paths: ['pom.xml'],
    command: {
      command: 'mvn test',
      env: {},
    },
  },
];

export default async function guessTestCommands(): Promise<
  TestCommand[] | undefined
> {
  const pathExists = await Promise.all(
    TestCommands.map((guess) => guess.paths).map(async (paths) =>
      Promise.all(paths.map(async (path) => exists(path)))
    )
  );
  return TestCommands.filter((_, idx) => pathExists[idx].every(Boolean)).map(
    (guess) => guess.command
  );
}
