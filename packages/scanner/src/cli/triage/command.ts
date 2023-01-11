import { Arguments, Argv } from 'yargs';
import readline from 'readline';

import { verbose } from '../../rules/lib/util';

import CommandOptions from './options';
import { handleWorkingDirectory } from '../handleWorkingDirectory';
import { readFile, writeFile } from 'fs/promises';
import { dump, load } from 'js-yaml';
import { directoryArg } from '../directoryArg';
import { exists } from '../../../../cli/src/utils';
import { FindingsState, FindingState, FindingStateItem, loadFindingsState } from '../findingsState';

export default {
  command: 'triage <finding...>',
  describe: 'Triage findings by assigning them to a workflow state',
  builder(args: Argv): Argv {
    directoryArg(args);

    args.option('state-file', {
      describe: 'Name of the file containing the findings state',
      type: 'string',
      default: 'appmap-findings-state.yml',
    });

    args.option('comment', {
      describe: 'Comment to associate with the triage action',
      alias: ['c'],
    });

    args.option('state', {
      describe: 'Workflow state to assign to the finding',
      type: 'string',
      demandOption: true,
      options: ['active', 'deferred', 'as-designed'],
      alias: ['s'],
    });

    args.positional('finding', {
      describe: 'Identifying hash (hash_v2 digest) of the finding',
      type: 'string',
      array: true,
    });

    return args.strict();
  },
  async handler(options: Arguments): Promise<void> {
    let { comment } = options as unknown as CommandOptions;
    const {
      stateFile: stateFileName,
      directory,
      verbose: isVerbose,
      state: stateStr,
      finding: findingHashArray,
    } = options as unknown as CommandOptions;

    if (isVerbose) {
      verbose(true);
    }

    handleWorkingDirectory(directory);
    const assignedState = stateStr as FindingState;
    const findingHashes = new Set<string>(findingHashArray);

    const triagedFindings = await loadFindingsState(stateFileName);

    if (!comment) {
      comment = await promptForComment();
    }

    const existingTriageItems = new Map<string, FindingStateItem>();
    // Remove any findings that are previously triaged and will now be recategorized.
    [FindingState.Active, FindingState.Deferred, FindingState.AsDesigned].forEach((state) => {
      triagedFindings[state] = triagedFindings[state].filter((triagedFinding) => {
        if (findingHashes.has(triagedFinding.hash_v2)) {
          triagedFinding.comment = comment;
          triagedFinding.updated_at = new Date(Date.now());
          existingTriageItems.set(triagedFinding.hash_v2, triagedFinding);
          return false;
        }
        return true;
      });
    });

    findingHashes.forEach((hash) => {
      let triagedFinding = existingTriageItems.get(hash);
      if (!triagedFinding) {
        triagedFinding = {
          hash_v2: hash,
          comment,
          updated_at: new Date(Date.now()),
        };
      }

      triagedFindings[assignedState].push(triagedFinding);
    });

    triagedFindings[assignedState] = triagedFindings[assignedState].sort((a, b) => {
      let diff = b.updated_at.getTime() - a.updated_at.getTime();
      if (diff === 0) diff = a.hash_v2.localeCompare(b.hash_v2);
      return diff;
    });

    await writeFile(stateFileName, dump(triagedFindings));
  },
};

async function promptForComment(): Promise<string | undefined> {
  if (process.stdout.isTTY) {
    const ui = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise<string | undefined>((resolve) =>
      ui.question('Comment (optional): ', resolve)
    );
  }
}
