import { executeCommand } from '../../lib/executeCommand';
import { prominentStyle } from './ui';
import { ValidationError } from './ValidationError';

export default async function detectRevisions(
  baseRevision: string,
  headArg: string
): Promise<{ baseRevision: string; headRevision: string }> {
  let headRevision = headArg;
  if (!headRevision) {
    let currentBranch = (await executeCommand(`git branch --show-current`)).trim();
    if (currentBranch === '') {
      currentBranch = (await executeCommand(`git show --format=oneline --abbrev-commit`)).split(
        /\s/
      )[0];
    }

    headRevision = currentBranch;
  }

  console.log(prominentStyle(`Current revision is: ${headRevision}`));

  if (baseRevision === headRevision) {
    throw new ValidationError(`Base and head revisions are the same: ${baseRevision}`);
  }

  return { baseRevision, headRevision };
}
