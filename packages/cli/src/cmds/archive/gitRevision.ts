import { exec } from 'child_process';

export default async function gitRevision(): Promise<string> {
  const revision = await new Promise<string | undefined>((resolve) => {
    exec('git rev-parse HEAD', (error, stdout) => {
      if (error) resolve(undefined);

      resolve(stdout.trim());
    });
  });

  if (!revision)
    throw new Error(
      `Unable to determine revision. Use --revision to specify it, or run this command in a Git repo.`
    );

  return revision;
}
