import { executeCommand } from '../../lib/executeCommand';

export default async function gitDeletedFiles(
  revision: string,
  folders?: string[]
): Promise<string[]> {
  const command = [`git diff --name-only --no-renames --diff-filter=D ${revision}`];
  if (folders) command.push(...folders);

  return (await executeCommand(command.join(' '))).trim().split('\n').filter(Boolean);
}
