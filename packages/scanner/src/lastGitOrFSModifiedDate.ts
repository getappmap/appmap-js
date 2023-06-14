import { debug, warn } from 'console';
import { verbose } from './rules/lib/util';
import { exec } from 'child_process';
import { stat } from 'fs/promises';

const FileModifiedDate = new Map<string, Date>();
let GitExists: boolean | undefined;

export function resetCache(): void {
  FileModifiedDate.clear();
}

export function isCached(file: string): boolean {
  return FileModifiedDate.has(file);
}

function detectGitExists(): Promise<boolean> {
  return new Promise((resolve) => {
    exec('git --version', (err) => {
      if (err && err.code && err.code > 0) resolve(false);

      resolve(true);
    });
  });
}

export async function gitExists(): Promise<boolean> {
  if (GitExists === undefined) {
    GitExists = await detectGitExists();
  }
  return GitExists;
}

export function gitModifiedDate(file: string): Promise<Date | undefined> {
  return new Promise<Date | undefined>((resolve) => {
    exec(`git log -n 1 --pretty=format:%cI ${file}`, (err, stdout) => {
      if (err && err.code && err.code > 0) resolve(undefined);
      if (stdout.trim() === '') resolve(undefined);

      resolve(new Date(stdout));
    });
  });
}

export async function fileModifiedDate(file: string): Promise<Date | undefined> {
  try {
    const stats = await stat(file);
    return stats.mtime;
  } catch (e) {
    warn(e);
  }
}

export default async function lastGitOrFSModifiedDate(file: string): Promise<Date | undefined> {
  let result = FileModifiedDate.get(file);
  if (result) {
    if (verbose()) debug(`Using cached modified date for ${file}`);
    return result.getTime() === 0 ? undefined : result;
  }

  if (verbose()) debug(`Computing modified date for ${file}`);

  if (await gitExists()) result = await gitModifiedDate(file);

  if (!result) result = await fileModifiedDate(file);

  FileModifiedDate.set(file, result || new Date(0));
  return result;
}
