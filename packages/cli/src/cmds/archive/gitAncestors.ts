import { exec } from 'child_process';

export default async function gitAncestors(defaultRevision?: string): Promise<string[]> {
  return new Promise<string[]>((resolve, reject) => {
    exec('git rev-list HEAD', (error, stdout) => {
      if (error) reject(error);

      resolve(stdout.trim().split('\n'));
    });
  });
}
