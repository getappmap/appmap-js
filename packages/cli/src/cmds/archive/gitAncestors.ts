import { exec } from 'child_process';

export default async function gitAncestors(revision: string): Promise<string[]> {
  return new Promise<string[]>((resolve, reject) => {
    exec(`git rev-list ${revision}`, (error, stdout) => {
      if (error) reject(error);

      resolve(stdout.trim().split('\n'));
    });
  });
}
