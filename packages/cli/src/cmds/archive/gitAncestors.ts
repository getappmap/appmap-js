import { executeCommand } from '../../lib/executeCommand';

export default async function gitAncestors(revision: string): Promise<string[]> {
  const command = `git rev-list ${revision}`;
  return (await executeCommand(command)).trim().split('\n').filter(Boolean);
}
