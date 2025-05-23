import { exec as execCallback, spawn } from 'node:child_process';
import { PathLike } from 'fs';
import { promisify } from 'util';

const exec = promisify(execCallback);

export enum GitState {
  NotInstalled, // The git cli was not found.
  NoRepository, // Git is installed but no repository was found.
  Ok, // Git is installed, a repository is present.
}

export const GitRepositoryEnvKeys = [
  'GITHUB_REPOSITORY', // GitHub
  'CIRCLE_REPOSITORY_URL', // CircleCI
  'GIT_URL', // Jenkins
  'CI_REPOSITORY_URL', // GitLab
] as const;

export const GitBranchEnvKeys = [
  'GITHUB_REF_NAME', // GitHub
  'CIRCLE_BRANCH', // CircleCI
  'GIT_BRANCH', // Jenkins
  'TRAVIS_BRANCH', // TravisCI
  'CI_COMMIT_REF_NAME', // GitLab
] as const;

export const GitCommitEnvKeys = [
  'GITHUB_SHA', // GitHub
  'CIRCLE_SHA1', // CircleCI
  'GIT_COMMIT', // Jenkins
  'TRAVIS_COMMIT', // TravisCI
  'CI_COMMIT_SHA', // GitLab
] as const;

class GitProperties {
  static async contributors(sinceDaysAgo: number, cwd?: PathLike): Promise<Array<string>> {
    const unixTimeNow = Math.floor(Number(new Date()) / 1000);
    const unixTimeAgo = unixTimeNow - sinceDaysAgo * 24 * 60 * 60;
    try {
      const { stdout } = await exec(
        [
          'git',
          cwd && `-C ${cwd.toString()}`,
          '--no-pager',
          'log',
          `--since=${unixTimeAgo}`,
          '--format="%ae"',
        ].join(' ')
      );
      return [
        ...stdout
          .trim()
          .split('\n')
          .reduce((acc, email) => {
            acc.add(email);
            return acc;
          }, new Set<string>()),
      ];
    } catch {
      return [];
    }
  }

  // Returns the repository URL, first by checking the environment, then by
  // shelling out to git.
  static async repository(cwd?: PathLike): Promise<string | undefined> {
    const envKey = GitRepositoryEnvKeys.find((key) => process.env[key]);
    if (envKey) return process.env[envKey];

    try {
      const { stdout } = await exec(
        ['git', cwd && `-C ${cwd.toString()}`, 'config', '--get', 'remote.origin.url'].join(' ')
      );
      return stdout.trim();
    } catch {
      return undefined;
    }
  }

  // Returns the branch, first by checking the environment, then by
  // shelling out to git.
  static async branch(cwd?: PathLike): Promise<string | undefined> {
    const envKey = GitBranchEnvKeys.find((key) => process.env[key]);
    if (envKey) return process.env[envKey];

    try {
      const { stdout } = await exec(
        ['git', cwd && `-C ${cwd.toString()}`, 'rev-parse', '--abbrev-ref', 'HEAD'].join(' ')
      );
      return stdout.trim();
    } catch {
      return undefined;
    }
  }

  // Returns the commit SHA, first by checking the environment, then by
  // shelling out to git.
  static async commit(cwd?: PathLike): Promise<string | undefined> {
    const envKey = GitCommitEnvKeys.find((key) => process.env[key]);
    if (envKey) return process.env[envKey];

    try {
      const { stdout } = await exec(
        ['git', cwd && `-C ${cwd.toString()}`, 'rev-parse', 'HEAD'].join(' ')
      );
      return stdout.trim();
    } catch {
      return undefined;
    }
  }

  static async state(cwd?: PathLike): Promise<GitState> {
    return new Promise<GitState>((resolve) => {
      try {
        const commandProcess = spawn('git', ['status', '--porcelain'], {
          shell: true,
          cwd: cwd?.toString(),
          stdio: 'ignore',
          timeout: 2000,
        });
        commandProcess.on('exit', (code) => {
          switch (code) {
            case 127:
              return resolve(GitState.NotInstalled);
            case 128:
              return resolve(GitState.NoRepository);
            default:
              return resolve(GitState.Ok);
          }
        });
        commandProcess.on('error', () => resolve(GitState.NotInstalled));
      } catch {
        resolve(GitState.NotInstalled);
      }
    });
  }

  static clearCache(): void {
    gitCache.clear();
  }
}

const gitCache = new Map<string | symbol, unknown>();
const noCacheList: Array<keyof typeof GitProperties> = ['clearCache'];

// GitProperties is available externally as Git.
// This export provides a simple caching layer around GitProperties to avoid
// excessive shelling out to git.
export const Git = new Proxy(GitProperties, {
  get(target, prop) {
    type TargetProp = keyof typeof target;
    if (
      !noCacheList.includes(prop.toString() as TargetProp) &&
      typeof target[prop as TargetProp] === 'function'
    ) {
      return new Proxy(target[prop as TargetProp], {
        apply(target, thisArg, argArray) {
          const cacheKey = `${prop.toString()}(${JSON.stringify(argArray)})`;
          if (gitCache.has(cacheKey)) {
            return gitCache.get(cacheKey);
          }
          // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
          const result: unknown = Reflect.apply(target as Function, thisArg, argArray);
          gitCache.set(cacheKey, result);
          return result;
        },
      }) as unknown;
    }
    return Reflect.get(target, prop) as unknown;
  },
});
