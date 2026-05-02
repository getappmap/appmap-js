import yargs from 'yargs';
import { log } from 'console';

import { handleWorkingDirectory } from '../../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../../lib/locateAppMapDir';
import { verbose } from '../../../utils';
import { openReadOnly } from '../lib/openReadOnly';
import { parseDuration, parseStatus, parseTime } from '../lib/parseFilter';
import { parseClassRef } from '../lib/scope';
import {
  find,
  FindFilter,
  FindType,
  FindAppmapRow,
  FindCallRow,
  FindExceptionRow,
  FindQueryRow,
  FindRequestRow,
} from '../queries/find';
import { formatMs, formatTable } from '../lib/format';

const TYPES: readonly FindType[] = ['appmaps', 'requests', 'queries', 'calls', 'exceptions'];

export const command = 'find <type>';
export const describe = 'Row-level search across recordings';

export const builder = <T>(args: yargs.Argv<T>) => {
  return args
    .positional('type', { type: 'string', choices: TYPES })
    .option('directory', { type: 'string', alias: 'd' })
    .option('appmap-dir', { type: 'string' })
    .option('query-db', { type: 'string', describe: 'path to query.db (overrides default)' })
    .option('route', {
      type: 'string',
      describe:
        'e.g. "POST /orders" or "/orders" (path is exact match; method case-insensitive)',
    })
    .option('class', { type: 'string', describe: 'defined_class or fqid Class part' })
    .option('method', { type: 'string', describe: 'method_id (not HTTP method)' })
    .option('label', { type: 'string' })
    .option('branch', { type: 'string' })
    .option('commit', { type: 'string' })
    .option('status', { type: 'string', describe: 'e.g. 500, ">=500"' })
    .option('duration', { type: 'string', describe: 'e.g. ">1s", ">=500ms"' })
    .option('since', { type: 'string' })
    .option('until', { type: 'string' })
    .option('appmap', { type: 'string', describe: 'appmap name' })
    .option('table', { type: 'string', describe: 'SQL table name (queries)' })
    .option('exception', { type: 'string', describe: 'exception class (exceptions)' })
    .option('limit', { type: 'number' })
    .option('offset', { type: 'number' })
    .option('json', { type: 'boolean', default: false });
};

type Argv = ReturnType<typeof builder> extends yargs.Argv<infer T> ? T : never;

// Per-type flag rejection list. Universal flags (--branch, --commit,
// --since, --until, --appmap) are accepted everywhere, as are output flags
// (--limit, --offset, --json). Other filter flags are accepted only on
// types where they make sense; flagging them on the wrong type is an
// error rather than a silent no-op.
const REJECTED_FLAGS: Record<FindType, readonly string[]> = {
  appmaps: ['class', 'method', 'label', 'table', 'exception'],
  requests: ['class', 'method', 'label', 'table', 'exception'],
  queries: ['label', 'exception'],
  calls: ['table', 'exception'],
  exceptions: ['class', 'method', 'label', 'duration', 'table'],
};

// Per-flag hints, attached to error messages when a rejected flag is used.
// Useful for nudging users toward the right flag (e.g., HTTP method
// belongs in --route, not --method, which is a function-method-name flag).
const REJECTED_HINTS: Partial<Record<FindType, Partial<Record<string, string>>>> = {
  requests: {
    method: 'to filter by HTTP method, use --route "METHOD /path"',
  },
};

// Exported for tests. Operates on a generic flag map so unit tests don't
// need a full yargs argv.
export function validateFlags(type: FindType, flags: Record<string, unknown>): void {
  const used: string[] = [];
  const hints: string[] = [];
  for (const flag of REJECTED_FLAGS[type]) {
    if (flags[flag] != null) {
      used.push(`--${flag}`);
      const hint = REJECTED_HINTS[type]?.[flag];
      if (hint) hints.push(`  --${flag}: ${hint}`);
    }
  }
  if (used.length === 0) return;
  const verb = used.length === 1 ? 'is' : 'are';
  let message = `find ${type}: ${used.join(', ')} ${verb} not supported for this type`;
  if (hints.length > 0) message += `\n${hints.join('\n')}`;
  throw new Error(message);
}

// Build a FindFilter from a yargs argv. Exported for testing — also makes
// the verb-layer transformations (e.g. splitting Class#method off of
// --class so the method composes via filter.method) directly assertable.
export interface ParsedFind {
  type: FindType;
  filter: FindFilter;
}

export function buildFindFilter(argv: Record<string, unknown>): ParsedFind {
  const type = argv.type as FindType;
  validateFlags(type, argv);

  const filter: FindFilter = {};
  if (typeof argv.route === 'string') filter.route = argv.route;
  if (typeof argv.label === 'string') filter.label = argv.label;
  if (typeof argv.branch === 'string') filter.branch = argv.branch;
  if (typeof argv.commit === 'string') filter.commit = argv.commit;
  if (typeof argv.status === 'string') filter.status = parseStatus(argv.status);
  if (typeof argv.duration === 'string') filter.duration = parseDuration(argv.duration);
  if (typeof argv.since === 'string') filter.since = parseTime(argv.since);
  if (typeof argv.until === 'string') filter.until = parseTime(argv.until);
  if (typeof argv.appmap === 'string') filter.appmap = argv.appmap;
  if (typeof argv.table === 'string') filter.table = argv.table;
  if (typeof argv.exception === 'string') filter.exception = argv.exception;
  if (typeof argv.limit === 'number') filter.limit = argv.limit;
  if (typeof argv.offset === 'number') filter.offset = argv.offset;

  // The documented --class form is "[pkg/]Class[#method]". Split the
  // method off here so it composes through filter.method even when the
  // user only supplied --class. Internal helpers (classFilterClauses /
  // sqlCallerClassClauses) also re-parse, but doing it at the verb gives
  // us a uniform contract: filter.className is "[pkg/]Class" only;
  // method, if any, lives on filter.method (and an explicit --method
  // wins over a method embedded in --class).
  let methodFilter = typeof argv.method === 'string' ? argv.method : undefined;
  if (typeof argv.class === 'string') {
    const parsed = parseClassRef(argv.class);
    if (parsed.method && !methodFilter) methodFilter = parsed.method;
    filter.className = argv.class;
  }
  if (methodFilter) filter.method = methodFilter;

  return { type, filter };
}

// Widened at the export so this module is assignable to CommandModule<T, any>.
export const handler = async (argvIn: yargs.ArgumentsCamelCase<unknown>): Promise<void> => {
  const argv = argvIn as yargs.ArgumentsCamelCase<Argv>;
  verbose(argv.verbose as boolean | undefined);
  handleWorkingDirectory(argv.directory);
  const appmapDir = argv.queryDb ? '' : await locateAppMapDir(argv.appmapDir);

  const { type, filter } = buildFindFilter(argv as Record<string, unknown>);

  const db = openReadOnly(appmapDir, argv.queryDb);
  try {
    const rows = find(db, type, filter);
    if (argv.json) {
      log(JSON.stringify(rows, null, 2));
      return;
    }
    log(renderTable(type, rows));
  } finally {
    db.close();
  }
};

function renderTable(type: FindType, rows: unknown[]): string {
  switch (type) {
    case 'appmaps':
      return formatTable(
        ['APPMAP', 'ROUTE', 'STATUS', 'ELAPSED', 'SQL', 'BRANCH', 'TIMESTAMP'],
        (rows as FindAppmapRow[]).map((r) => [
          r.appmap_name,
          r.route ?? '',
          r.status_code != null ? String(r.status_code) : '',
          formatMs(r.elapsed_ms),
          String(r.sql_count),
          r.branch ?? '',
          r.timestamp ?? '',
        ])
      );
    case 'requests':
      return formatTable(
        ['APPMAP', 'METHOD', 'ROUTE', 'STATUS', 'ELAPSED', 'BRANCH'],
        (rows as FindRequestRow[]).map((r) => [
          r.appmap_name,
          r.method,
          r.route,
          String(r.status_code),
          formatMs(r.elapsed_ms),
          r.branch ?? '',
        ])
      );
    case 'queries':
      return formatTable(
        ['APPMAP', 'ELAPSED', 'CALLER', 'SQL'],
        (rows as FindQueryRow[]).map((r) => [
          r.appmap_name,
          formatMs(r.elapsed_ms),
          r.caller_class && r.caller_method ? `${r.caller_class}#${r.caller_method}` : '',
          r.sql_text,
        ])
      );
    case 'calls':
      return formatTable(
        ['APPMAP', 'FQID', 'ELAPSED', 'PARAMS', 'RETURN'],
        (rows as FindCallRow[]).map((r) => [
          r.appmap_name,
          r.fqid ?? `${r.defined_class}#${r.method_id}`,
          formatMs(r.elapsed_ms),
          formatParams(r.parameters_json),
          r.return_value ?? '',
        ])
      );
    case 'exceptions':
      return formatTable(
        ['APPMAP', 'CLASS', 'MESSAGE', 'EVENT'],
        (rows as FindExceptionRow[]).map((r) => [
          r.appmap_name,
          r.exception_class,
          r.message ?? '',
          String(r.event_id),
        ])
      );
  }
}

function formatParams(json: string | null): string {
  if (!json) return '';
  try {
    const parsed = JSON.parse(json) as Array<{ name?: string; value?: unknown }>;
    return parsed
      .map((p) => `${p.name ?? '?'}=${typeof p.value === 'string' ? p.value : JSON.stringify(p.value)}`)
      .join(', ');
  } catch {
    return json;
  }
}
