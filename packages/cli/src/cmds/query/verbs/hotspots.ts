import yargs from 'yargs';
import { log } from 'console';

import { handleWorkingDirectory } from '../../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../../lib/locateAppMapDir';
import { verbose } from '../../../utils';
import { openReadOnly } from '../lib/openReadOnly';
import { truncationFooter } from '../lib/page';
import { parseTime } from '../lib/parseFilter';
import {
  FunctionHotspotRow,
  HotspotsFilter,
  HotspotType,
  SqlHotspotRow,
  hotspots,
} from '../queries/hotspots';
import { formatCount, formatMs, formatTable } from '../lib/format';

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

type Argv = ReturnType<typeof builder> extends yargs.Argv<infer T> ? T : never;

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
export const handler = async (argvIn: yargs.ArgumentsCamelCase<unknown>): Promise<void> => {
  const argv = argvIn as yargs.ArgumentsCamelCase<Argv>;
  verbose(argv.verbose as boolean | undefined);
  handleWorkingDirectory(argv.directory);
  const appmapDir = argv.queryDb ? '' : await locateAppMapDir(argv.appmapDir);

  const type = argv.type as HotspotType;
  validateFlags(type, argv as Record<string, unknown>);

  const filter: HotspotsFilter = { type };
  if (argv.route) filter.route = argv.route;
  if (argv.class) filter.className = argv.class;
  if (argv.branch) filter.branch = argv.branch;
  if (argv.since) filter.since = parseTime(argv.since);
  if (argv.until) filter.until = parseTime(argv.until);
  if (argv.limit !== undefined) filter.limit = argv.limit;
  if (argv.offset !== undefined) filter.offset = argv.offset;

  const db = openReadOnly(appmapDir, argv.queryDb);
  try {
    const page = hotspots(db, filter);
    if (argv.json) {
      log(JSON.stringify(page, null, 2));
      return;
    }
    log(
      filter.type === 'sql'
        ? renderSql(page.rows as readonly SqlHotspotRow[])
        : renderFunctions(page.rows as readonly FunctionHotspotRow[])
    );
    const footer = truncationFooter(page);
    if (footer) log(footer);
  } finally {
    db.close();
  }
};

function renderFunctions(rows: readonly FunctionHotspotRow[]): string {
  return formatTable(
    ['FQID', 'CALLS', 'TOTAL_MS', 'SELF_MS'],
    rows.map((r) => [
      r.fqid ?? `${r.defined_class}#${r.method_id}`,
      formatCount(r.calls),
      formatMs(r.total_ms),
      formatMs(r.self_ms),
    ])
  );
}

function renderSql(rows: readonly SqlHotspotRow[]): string {
  return formatTable(
    ['COUNT', 'AVG', 'TOTAL', 'SQL'],
    rows.map((r) => [
      formatCount(r.count),
      formatMs(r.avg_ms),
      formatMs(r.total_ms),
      r.sql_text,
    ])
  );
}
