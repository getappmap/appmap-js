import { exec } from 'child_process';

export default async function gitModifiedFiles(
  revision: string,
  diffFilters: string[],
  folders?: string[]
): Promise<string[]> {
  const command = [`git diff --name-only --no-renames `];
  if (diffFilters.length > 0) command.push(`--diff-filter=${diffFilters.join('')}`);
  command.push(revision);
  if (folders) command.push(...folders);

  return new Promise<string[]>((resolve, reject) => {
    exec(command.join(' '), (error, stdout) => {
      if (error) reject(error);

      resolve(stdout.trim().split('\n').filter(Boolean));
    });
  });
}
