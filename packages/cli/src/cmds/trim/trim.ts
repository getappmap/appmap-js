import Yargs from 'yargs';

import lazyHandler from '../../lib/lazyHandler';
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

interface TrimmedMarker {
  version: string;
  max_length: number;
}

export interface AppMap {
  metadata?: { trimmed?: TrimmedMarker; [key: string]: unknown };
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

  handler: lazyHandler(() => import('./trimHandler')),
};
