import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, join } from 'path';
import Yargs from 'yargs';

import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { MCP_RETURN_VALUE_BUDGET, truncateStructValue } from '../../lib/truncateStructValue';
import type { StructBudget } from '../../lib/truncateStructValue';

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
      describe: 'Maximum length of a captured value string (structured values are budgeted per field)',
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

    // maxFields 12 (vs the MCP renderer's 16): trim leans slightly more
    // aggressive since a committed baseline wants leanness over readability.
    const budget: StructBudget = {
      ...MCP_RETURN_VALUE_BUDGET,
      maxFields: 12,
      flatCap: argv.maxLength,
    };
    const files = argv.files as string[];
    if (argv.outputDir) mkdirSync(argv.outputDir, { recursive: true });

    for (const file of files) {
      const before = readFileSync(file, 'utf8');
      const trimmed = JSON.stringify(trimAppMap(JSON.parse(before) as AppMap, budget));
      const outputPath = argv.outputDir ? join(argv.outputDir, basename(file)) : file;
      writeFileSync(outputPath, trimmed);
      const pct = Math.round((100 * trimmed.length) / before.length);
      console.warn(`trim ${file}: ${before.length} -> ${trimmed.length} bytes (${pct}%)`);
    }
  },
};
