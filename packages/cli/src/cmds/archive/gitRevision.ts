import { executeCommand } from '../../lib/executeCommand';

export default async function gitRevision(): Promise<string> {
  const revision = (await executeCommand('git rev-parse HEAD')).trim();
  if (!revision)
    throw new Error(
      `Unable to determine revision. Use --revision to specify it, or run this command in a Git repo.`
    );

  return revision;
}
