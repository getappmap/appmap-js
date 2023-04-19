import { executeCommand } from '../../lib/executeCommand';

export default async function gitAncestors(revision: string): Promise<string[]> {
  const command = `git rev-list ${revision}`;
  try {
    return (await executeCommand(command)).trim().split('\n').filter(Boolean);
  } catch {
    console.warn(`No ancestors found for ${revision}. Will match exact revision only.`);
    return [revision];
  }
}
