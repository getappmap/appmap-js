import makeDebug from 'debug';

import { verbose } from '../utils';
import { exec as execCb } from 'node:child_process';
import { promisify } from 'util';

const debug = makeDebug('appmap:listGitProjectFiles');
const exec = promisify(execCb);

// Run git ls-files and git status to get a list of all git-managed files. By doing it this way,
// we automatically apply any .gitignore rules.
export default async function listGitProjectFiles(directory: string): Promise<string[]> {
  const lsFiles = async (): Promise<string[]> => {
    try {
      const { stdout } = await exec('git ls-files', {
        cwd: directory,
        maxBuffer: 1024 ** 2 * 20, // 20 MB
      });

      debug(stdout);

      return stdout.split('\n').filter(Boolean);
    } catch (e) {
      if (verbose()) {
        console.error('`git ls-files` failed');
        console.error(e);
      }
      return [];
    }
  };

  const statusFiles = async (): Promise<string[]> => {
    try {
      const { stdout } = await exec('git status --porcelain', {
        cwd: directory,
        maxBuffer: 1024 ** 2 * 20, // 20 MB
      });

      debug(stdout);

      return stdout
        .split('\n')
        .map((line) => {
          // git status --porcelain output starts with 3 characters: staged status, unstaged status,
          // and a space.
          return line.slice(3);
        })
        .filter(Boolean);
    } catch (e) {
      if (verbose()) {
        console.error('`git status --porcelain` failed');
        console.error(e);
      }
      return [];
    }
  };

  return Array.from(new Set([...(await lsFiles()), ...(await statusFiles())]));
}
