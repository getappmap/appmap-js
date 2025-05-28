import { execute } from './executeCommand';
import { warn } from 'node:console';
import { verbose } from '../utils';

const DEV_NULL = process.platform === 'win32' ? 'NUL' : '/dev/null';

/**
 * Find the distance between the base commit and the head commit.
 *
 * @param {string} [base='HEAD'] - The base commit to compare against.
 * @param {string} [head='HEAD'] - The head commit to compare against.
 * @param {string} [cwd] - The working directory to run the command in.
 * @returns {Promise<number | undefined>} A promise containing the distance between the base and
 * head commits, or undefined if the distance could not be resolved.
 */
async function getCommitDistance(
  base: string,
  head: string,
  cwd?: string
): Promise<number | undefined> {
  try {
    const result = await execute('git', ['rev-list', '--count', `${base}..${head}`], { cwd });
    const distance = parseInt(result);
    return Number.isNaN(distance) ? undefined : distance;
  } catch (e: unknown) {
    if (verbose()) {
      warn(`Failed to retrieve commit distance between ${base} and ${head}`);
      warn(String(e));
    }
  }
}

/**
 * Find the nearest base commit for the given head commit.
 *
 * @param {string[]} baseRefs - The base commits to compare against.
 * @param {string} headRef - The head commit to compare against.
 * @param {string} [cwd] - The working directory to run the command in.
 * @returns {Promise<string | undefined>} A promise containing the nearest base commit, or
 * undefined if no base commit could be resolved.
 */
async function findNearestBranch(
  baseRefs: string[],
  headRef: string,
  cwd?: string
): Promise<string | undefined> {
  const distances = await Promise.all(
    baseRefs.map((branch) => getCommitDistance(branch, headRef, cwd))
  );

  const validDistances = distances.filter((distance): distance is number => distance !== undefined);
  if (validDistances.length === 0) return undefined;

  return baseRefs[distances.indexOf(Math.min(...validDistances))];
}

// These are the default branch names that we'll use to find the nearest base commit.
const mainBranches = ['main', 'master', 'develop'];

/**
 * Find the base commit of the current branch.
 *
 * @param [headRef='HEAD'] - The reference to identify the base commit.
 * @param [cwd] - The working directory to run the command in.
 * @returns A promise containing the base commit, or undefined if the
 * base commit could not be found.
 */
export async function findBaseCommit(headRef = 'HEAD', cwd?: string): Promise<string | undefined> {
  try {
    const nearestBase = await findNearestBranch(mainBranches, headRef, cwd);
    if (!nearestBase) return;

    let baseCommit = await execute('git', ['merge-base', nearestBase, headRef], { cwd });
    baseCommit = baseCommit.trim();
    return baseCommit !== '' ? baseCommit : undefined;
  } catch (e: unknown) {
    if (verbose()) {
      warn(`Failed to find base commit for ${headRef}`);
      warn(String(e));
    }
  }
}

/**
 * Get the list of untracked files in the working directory.
 *
 * @param [cwd] - The working directory to run the command in.
 * @returns A promise containing the list of untracked files.
 * @throws {Error} If the command fails.
 */
export async function getUntrackedFiles(cwd?: string): Promise<string[]> {
  const result = await execute('git', ['ls-files', '--others', '--exclude-standard'], { cwd });
  return result
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean);
}

/**
 * This method produces the diff between your working directory and HEAD, returning the changes that
 * have not yet been committed.
 *
 * @param [cwd] - The working directory to run the command in.
 * @returns {Promise<string>} A promise containing the diff.
 */
export async function getWorkingDiff(cwd?: string): Promise<string> {
  let untrackedFiles: string[] = [];
  try {
    untrackedFiles = await getUntrackedFiles(cwd);
  } catch (e) {
    if (verbose()) {
      warn(`Failed to retrieve untracked files`);
      warn(e);
    }
  }

  const untrackedDiffs: string[] = [];

  // Do this serially to avoid spawning too many processes.
  for (const file of untrackedFiles) {
    try {
      untrackedDiffs.push(
        // When using `--no-index`, an exit code of 1 is expected.
        await execute(
          'git',
          ['--no-pager', 'diff', '--no-index', '--function-context', DEV_NULL, file],
          {
            cwd,
            exitCode: 1,
          }
        )
      );
    } catch (e) {
      warn(`Failed to retrieve diff for ${file}`);
      warn(e);
    }
  }

  const indexedDiff = await execute('git', ['--no-pager', 'diff', '--function-context', 'HEAD'], {
    cwd,
  }).catch((e) => {
    warn(`Failed to retrieve diff for HEAD`);
    warn(e);
    return '';
  });

  return [indexedDiff, ...untrackedDiffs].filter(Boolean).join('\n');
}

/**
 * Get the diff between the base commit and the head commit. The diff produced by this function
 * is in the form of a git log, so commit messages are included.
 *
 * @param [headCommit='HEAD'] - The head commit to compare against.
 * @param baseCommit - The base commit to compare against. If not provided, the base commit
 * will be found automatically via {@link findBaseCommit}.
 * @param [cwd] - The working directory to run the command in.
 * @returns A promise containing the diff.
 */
export async function getDiffLog(
  headCommit = 'HEAD',
  baseCommit?: string,
  cwd?: string
): Promise<string> {
  const base = baseCommit ?? (await findBaseCommit(headCommit, cwd));
  if (!base) return '';

  const result = await execute(
    'git',
    ['--no-pager', 'log', '-p', '--full-diff', `${base}..${headCommit}`],
    {
      cwd,
    }
  );
  return result;
}
