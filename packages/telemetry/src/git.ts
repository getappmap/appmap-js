import { execFile, spawn } from 'child_process';
import { PathLike } from 'fs';

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

/**
 * This is a wrapper around `execFile` that returns a promise containing the stdout. `execFile` will
 * not spawn a shell, so it is less likely to be vulnerable to shell injection attacks.
 *
 * @param {string} command - The command to execute. This should be resolvable via `PATH`, and contain no arguments.
 * @param {string[]} args - The arguments to pass to the command.
 * @param {object} [options] - Options to pass to `execFile`.
 * @returns {Promise<string>} A promise containing the stdout of the command.
 * @throws {Error} If the command fails with a non-zero (or anything other than the specified) exit code.
 */
export const execute = (
  command: string,
  args: string[],
  options?: { cwd?: string; exitCode?: number; timeout?: number }
): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const child = execFile(command, args, { ...(options ?? {}) });

    let stdout = '';
    child.stdout?.setEncoding('utf8');
    child.stdout?.on('data', (data: string) => {
      stdout += data.toString();
    });

    let stderr = '';
    child.stderr?.setEncoding('utf8');
    child.stderr?.on('data', (data: string) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === (options?.exitCode ?? 0)) resolve(stdout);
      else reject(new Error(stderr));
    });
  });

class GitProperties {
  static async contributors(sinceDaysAgo: number, cwd?: PathLike): Promise<Array<string>> {
    const unixTimeNow = Math.floor(Number(new Date()) / 1000);
    const unixTimeAgo = unixTimeNow - sinceDaysAgo * 24 * 60 * 60;
    try {
      const args = ['--no-pager', 'log', `--since=${unixTimeAgo}`, '--format="%ae"'];
      if (cwd) args.unshift('-C', cwd.toString());

      const stdout = await execute('git', args);
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
      const args = ['config', '--get', 'remote.origin.url'];
      if (cwd) args.unshift('-C', cwd.toString());

      const stdout = await execute('git', args);
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
      const args = ['rev-parse', '--abbrev-ref', 'HEAD'];
      if (cwd) args.unshift('-C', cwd.toString());

      const stdout = await execute('git', args);
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
      const args = ['rev-parse', 'HEAD'];
      if (cwd) args.unshift('-C', cwd.toString());

      const stdout = await execute('git', args);
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
          /* eslint-disable-next-line @typescript-eslint/no-unsafe-function-type */
          const result: unknown = Reflect.apply(target as Function, thisArg, argArray);
          gitCache.set(cacheKey, result);
          return result;
        },
      }) as unknown;
    }
    return Reflect.get(target, prop) as unknown;
  },
});
