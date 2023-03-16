import { exec } from 'child_process';

export default async function gitDeletedFiles(
  revision: string,
  folders?: string[]
): Promise<string[]> {
  const command = [`git diff --name-only --no-renames --diff-filter=D ${revision}`];
  if (folders) command.push(...folders);

  return new Promise<string[]>((resolve, reject) => {
    exec(command.join(' '), (error, stdout) => {
      if (error) reject(error);

      resolve(stdout.trim().split('\n').filter(Boolean));
    });
  });
}
