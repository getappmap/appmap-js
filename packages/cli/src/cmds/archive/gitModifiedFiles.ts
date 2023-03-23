import { executeCommand } from '../../lib/executeCommand';

export default async function gitModifiedFiles(
  revision: string,
  diffFilters: string[],
  folders?: string[]
): Promise<string[]> {
  const command = [`git diff --name-only --no-renames `];
  if (diffFilters.length > 0) command.push(`--diff-filter=${diffFilters.join('')}`);
  command.push(revision);
  if (folders) command.push(...folders);

  return (await executeCommand(command.join(' '))).trim().split('\n').filter(Boolean);
}
