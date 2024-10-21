import { promisify } from 'util';
import makeDebug from 'debug';
import { exec as execCb } from 'node:child_process';

import { Git, GitState } from './git';
import assert from 'assert';
import { readdir } from 'fs/promises';
import { join, relative } from 'path';

const debug = makeDebug('appmap:search:project-files');
const exec = promisify(execCb);

export default async function listProjectFiles(directory: string): Promise<string[]> {
  const gitState = await Git.state(directory);
  debug(`Git state: %s`, gitState);
  return gitState === GitState.Ok
    ? await listGitProjectFiles(directory)
    : await listLikelyProjectFiles(directory);
}

// Run git ls-files and git status to get a list of all git-managed files. By doing it this way,
// we automatically apply any .gitignore rules.
export async function listGitProjectFiles(directory: string): Promise<string[]> {
  const lsFiles = async (): Promise<string[]> => {
    try {
      const { stdout } = await exec('git ls-files', {
        cwd: directory,
        maxBuffer: 1024 ** 2 * 20, // 20 MB
      });

      debug(stdout);

      return stdout.split('\n').filter(Boolean);
    } catch (e) {
      debug('`git ls-files` failed: %s', e);
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
      debug('`git status --porcelain` failed: %s', e);
      return [];
    }
  };

  return Array.from(new Set([...(await lsFiles()), ...(await statusFiles())]));
}

const IGNORE_DIRECTORIES = new Set([
  '.git',
  '.venv',
  '.yarn',
  'node_modules',
  'vendor',
  'build',
  'built',
  'dist',
  'out',
  'target',
  'tmp',
  'venv',
]);

// Produce a modest-sized listing of files in the project.
// Ignore a standard list of binary file extensions and directories that tend to be full of
// non-source files.
export async function listLikelyProjectFiles(directory: string): Promise<string[]> {
  const files = new Array<string>();

  const ignoreDirectory = (dir: string) => IGNORE_DIRECTORIES.has(dir);

  // Perform a breadth-first traversal of a directory, collecting all non-binary files and
  // applying the directory ignore list.
  const processDir = async (dir: string) => {
    const queue = [dir];
    while (queue.length > 0) {
      const currentDir = queue.shift();
      assert(currentDir, 'queue should not be empty');

      const entries = await readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const path = join(currentDir, entry.name);
        if (entry.isDirectory()) {
          if (!ignoreDirectory(entry.name)) queue.push(path);
        } else files.push(relative(dir, path));
      }
    }
  };

  await processDir(directory);

  return files;
}
