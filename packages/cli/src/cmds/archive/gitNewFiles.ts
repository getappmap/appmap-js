import { exec } from 'child_process';

export default async function gitNewFiles(folders?: string[]): Promise<string[]> {
  const command = ['git ls-files -o --exclude-standard'];
  if (folders) command.push(...folders);

  return new Promise<string[]>((resolve, reject) => {
    exec(command.join(' '), (error, stdout) => {
      if (error) reject(error);

      resolve(stdout.trim().split('\n').filter(Boolean));
    });
  });
}
