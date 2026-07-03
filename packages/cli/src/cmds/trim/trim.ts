import { mkdirSync, readFileSync } from 'fs';
import { basename, dirname, join } from 'path';
import Yargs from 'yargs';

import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { MCP_RETURN_VALUE_BUDGET, truncateStructValue } from '../../lib/truncateStructValue';
import type { StructBudget } from '../../lib/truncateStructValue';
import { writeFileAtomic } from '../../utils';

// The captured `value` of a parameter, return value, receiver, or log message.
interface ValueSlot {
  value?: unknown;
}

interface AppMapEvent {
  parameters?: ValueSlot[];
  message?: ValueSlot[];
  receiver?: ValueSlot;
  return_value?: ValueSlot;
  exceptions?: ValueSlot[];
}

interface AppMap {
  events?: AppMapEvent[];
}

function trimSlot(slot: ValueSlot | undefined, budget: StructBudget): void {
  if (slot && typeof slot.value === 'string') {
    slot.value = truncateStructValue(slot.value, budget);
  }
}

// Truncate every captured value string in an AppMap, in place. Trimming only
// touches `value` strings — the call structure, code objects, SQL, and every
// other stable property are untouched — so a trimmed AppMap is behaviorally
// identical (its sequence-diagram digest is unchanged) but much smaller.
export function trimAppMap(appmap: AppMap, budget: StructBudget = MCP_RETURN_VALUE_BUDGET): AppMap {
  for (const event of appmap.events ?? []) {
    for (const p of event.parameters ?? []) trimSlot(p, budget);
    for (const m of event.message ?? []) trimSlot(m, budget);
    trimSlot(event.receiver, budget);
    trimSlot(event.return_value, budget);
    for (const x of event.exceptions ?? []) trimSlot(x, budget);
  }
  return appmap;
}

export default {
  command: 'trim <files..>',

  describe:
    'Shrink AppMaps by truncating captured parameter, return, receiver, and message values',

  builder: (args: Yargs.Argv) => {
    args.positional('files', {
      describe: 'AppMap file(s) to trim',
      type: 'string',
    });

    args.option('max-length', {
      describe:
        'Maximum length of any captured value string — caps flat strings and struct field/id values alike',
      type: 'number',
      default: MCP_RETURN_VALUE_BUDGET.flatCap,
    });

    args.option('output-dir', {
      describe: 'Write trimmed AppMaps here (default: overwrite each file in place)',
      type: 'string',
      alias: 'o',
    });

    args.option('directory', {
      describe: 'Working directory for the command',
      type: 'string',
      alias: 'd',
    });

    return args;
  },

  handler: async (argv: any): Promise<void> => {
    handleWorkingDirectory(argv.directory);

    // --max-length is a hard cap on every captured value string: it sets the
    // flat cap and, so the flag means what it says, lowers the per-field and id
    // caps to match (never above their defaults). maxFields 12 (vs the MCP
    // renderer's 16) — trim leans slightly more aggressive since a baseline
    // wants leanness over readability.
    const maxLength = argv.maxLength as number;
    const budget: StructBudget = {
      perValueCap: Math.min(MCP_RETURN_VALUE_BUDGET.perValueCap, maxLength),
      idCap: Math.min(MCP_RETURN_VALUE_BUDGET.idCap, maxLength),
      maxFields: 12,
      flatCap: maxLength,
    };
    const files = argv.files as string[];
    if (argv.outputDir) mkdirSync(argv.outputDir, { recursive: true });

    let failed = 0;
    for (const file of files) {
      let before: string;
      let trimmed: string;
      try {
        before = readFileSync(file, 'utf8');
        trimmed = JSON.stringify(trimAppMap(JSON.parse(before) as AppMap, budget));
      } catch (error) {
        // Skip an unreadable/malformed file rather than aborting: one bad file
        // in a batch must not stop the rest or leave earlier files half-done.
        failed += 1;
        console.warn(`trim ${file}: skipped (${(error as Error).message})`);
        continue;
      }
      const outputPath = argv.outputDir ? join(argv.outputDir, basename(file)) : file;
      // Write atomically (temp file in the same dir, then rename) so an
      // interrupted or failed write never leaves a partial AppMap in place.
      await writeFileAtomic(dirname(outputPath), basename(outputPath), 'trim.tmp', trimmed);
      const pct = Math.round((100 * trimmed.length) / before.length);
      console.warn(`trim ${file}: ${before.length} -> ${trimmed.length} bytes (${pct}%)`);
    }
    if (files.length > 0 && failed === files.length) {
      throw new Error(`trim: all ${failed} input file(s) failed to process`);
    }
  },
};
