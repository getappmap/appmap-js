import yargs from 'yargs';
import { log } from 'console';

import { handleWorkingDirectory } from '../../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../../lib/locateAppMapDir';
import { verbose } from '../../../utils';
import { openReadOnly } from '../lib/openReadOnly';
import { parseDuration, parseStatus, parseTime } from '../lib/parseFilter';
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
    .option('route', { type: 'string', describe: 'e.g. "POST /orders" or "/orders"' })
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
  appmaps: ['class', 'method', 'label', 'duration', 'table', 'exception'],
  requests: ['class', 'method', 'label', 'table', 'exception'],
  queries: ['label', 'exception'],
  calls: ['table', 'exception'],
  exceptions: ['class', 'method', 'label', 'duration', 'table'],
};

// Exported for tests. Operates on a generic flag map so unit tests don't
// need a full yargs argv.
export function validateFlags(type: FindType, flags: Record<string, unknown>): void {
  const used: string[] = [];
  for (const flag of REJECTED_FLAGS[type]) {
    if (flags[flag] != null) used.push(`--${flag}`);
  }
  if (used.length > 0) {
    const verb = used.length === 1 ? 'is' : 'are';
    throw new Error(
      `find ${type}: ${used.join(', ')} ${verb} not supported for this type`
    );
  }
}

export const handler = async (argv: yargs.ArgumentsCamelCase<Argv>): Promise<void> => {
  verbose(argv.verbose as boolean | undefined);
  handleWorkingDirectory(argv.directory);
  const appmapDir = argv.queryDb ? '' : await locateAppMapDir(argv.appmapDir);

  const type = argv.type as FindType;
  validateFlags(type, argv);

  const filter: FindFilter = {};
  if (argv.route) filter.route = argv.route;
  if (argv.class) filter.className = argv.class;
  if (argv.method) filter.method = argv.method;
  if (argv.label) filter.label = argv.label;
  if (argv.branch) filter.branch = argv.branch;
  if (argv.commit) filter.commit = argv.commit;
  if (argv.status) filter.status = parseStatus(argv.status);
  if (argv.duration) filter.duration = parseDuration(argv.duration);
  if (argv.since) filter.since = parseTime(argv.since);
  if (argv.until) filter.until = parseTime(argv.until);
  if (argv.appmap) filter.appmap = argv.appmap;
  if (argv.table) filter.table = argv.table;
  if (argv.exception) filter.exception = argv.exception;
  if (argv.limit !== undefined) filter.limit = argv.limit;
  if (argv.offset !== undefined) filter.offset = argv.offset;

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
