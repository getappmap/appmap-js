import { executeCommand } from '../../lib/executeCommand';
import * as UI from './ui';

export async function checkout(revisionName: string, revision: string): Promise<void> {
  console.log();
  console.log(UI.actionStyle(`Switching to ${revisionName} revision: ${revision}`));
  await executeCommand(`git checkout ${revision}`, true, true, true);
  console.log();
}
