import { cwd } from 'process';
import { exists, verbose } from '../../../utils';
import { TestCommand } from '../configuration';

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
      command: 'bundle exec rails test',
    },
  },
  {
    paths: ['pom.xml'],
    command: {
      command: 'mvn test',
      env: {},
    },
  },
  {
    paths: ['package.json', 'node_modules/mocha'],
    command: {
      command: 'npx appmap-node npx mocha',
      env: {},
    },
  },
  {
    paths: ['package.json', 'node_modules/@jest'],
    command: {
      command: 'npx appmap-node npx jest',
      env: {},
    },
  },
];

export default async function guessTestCommands(): Promise<TestCommand[] | undefined> {
  const pathExists = await Promise.all(
    TestCommands.map((guess) => guess.paths).map(async (paths) =>
      Promise.all(paths.map(async (path) => exists(path)))
    )
  );
  return TestCommands.filter((_, idx) => pathExists[idx].every(Boolean)).map(
    (guess) => guess.command
  );
}
