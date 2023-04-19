import { executeCommand } from '../../lib/executeCommand';

export default async function gitNewFiles(folders?: string[]): Promise<string[]> {
  const command = ['git ls-files -o --exclude-standard'];
  if (folders) command.push(...folders);

  return (await executeCommand(command.join(' '))).trim().split('\n').filter(Boolean);
}
