import yargs from 'yargs';

import lazyHandler from '../../../lib/lazyHandler';
import type { HotspotType } from '../queries/hotspots';

export const command = 'hotspots';
export const describe = 'Rank functions or SQL queries by cumulative elapsed';

export const builder = <T>(args: yargs.Argv<T>) => {
  return args
    .option('directory', { type: 'string', alias: 'd' })
    .option('appmap-dir', { type: 'string' })
    .option('query-db', { type: 'string', describe: 'path to query.db (overrides default)' })
    .option('type', {
      type: 'string',
      choices: ['function', 'sql'] as const,
      default: 'function',
    })
    .option('route', {
      type: 'string',
      describe: 'e.g. "GET /reports" (path is exact match; method case-insensitive)',
    })
    .option('class', { type: 'string', describe: 'class filter (function mode only)' })
    .option('branch', { type: 'string' })
    .option('since', { type: 'string' })
    .option('until', { type: 'string' })
    .option('limit', { type: 'number', describe: 'default 20; pass 0 for unbounded' })
    .option('offset', { type: 'number' })
    .option('json', { type: 'boolean', default: false });
};

export type Argv = ReturnType<typeof builder> extends yargs.Argv<infer T> ? T : never;

// Per-type flag rejection list. Same shape as find's: a small allow-list
// surfaces user mistakes (e.g. --class on --type=sql) instead of silently
// dropping them, and pre-empts future filter additions that only one
// type can honor.
const REJECTED_FLAGS: Record<HotspotType, readonly string[]> = {
  function: [],
  sql: ['class'],
};

// Exported for tests.
export function validateFlags(type: HotspotType, flags: Record<string, unknown>): void {
  const used: string[] = [];
  for (const flag of REJECTED_FLAGS[type]) {
    if (flags[flag] != null) used.push(`--${flag}`);
  }
  if (used.length === 0) return;
  const verb = used.length === 1 ? 'is' : 'are';
  throw new Error(
    `hotspots --type=${type}: ${used.join(', ')} ${verb} not supported for this type`
  );
}

// Widened at the export so this module is assignable to CommandModule<T, any>.
export const handler = lazyHandler(() => import('./hotspotsHandler'));
