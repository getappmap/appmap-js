import yargs from 'yargs';

import lazyHandler from '../../../lib/lazyHandler';
import { parseDuration, parseStatus, parseTime } from '../lib/parseFilter';
import { parseClassRef } from '../lib/scope';
import type { FindFilter, FindType } from '../queries/find';
import { projectLogMessage } from '../lib/logMessage';

export { projectLogMessage };

const TYPES: readonly FindType[] = ['appmaps', 'requests', 'queries', 'calls', 'exceptions', 'logs'];
// 'recordings' is accepted as an alias for 'appmaps' to match the MCP
// naming (find_recordings) and the user-facing concept of a "recording".
const TYPE_CHOICES: readonly string[] = ['appmaps', 'recordings', ...TYPES.filter((t) => t !== 'appmaps')];

function normalizeType(input: string): FindType {
  return (input === 'recordings' ? 'appmaps' : input) as FindType;
}

export const command = 'find <type>';
export const describe = 'Row-level search across recordings';

export const builder = <T>(args: yargs.Argv<T>) => {
  return args
    .positional('type', { type: 'string', choices: TYPE_CHOICES })
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
    .option('event-id', {
      type: 'number',
      array: true,
      describe: 'exact event_id(s) to fetch (calls); repeatable',
    })
    .option('branch', { type: 'string' })
    .option('commit', { type: 'string' })
    .option('status', { type: 'string', describe: 'e.g. 500, ">=500"' })
    .option('duration', { type: 'string', describe: 'e.g. ">1s", ">=500ms"' })
    .option('since', { type: 'string' })
    .option('until', { type: 'string' })
    .option('appmap', { type: 'string', describe: 'appmap name' })
    .option('table', { type: 'string', describe: 'SQL table name (queries)' })
    .option('exception', { type: 'string', describe: 'exception class (exceptions)' })
    .option('logger', { type: 'string', describe: 'logger class (logs)' })
    .option('message', { type: 'string', describe: 'log message substring (logs)' })
    .option('with-logs', {
      type: 'number',
      describe: 'attach the last N log lines preceding each row (exceptions)',
    })
    .option('limit', { type: 'number' })
    .option('offset', { type: 'number' })
    .option('json', { type: 'boolean', default: false });
};

export type Argv = ReturnType<typeof builder> extends yargs.Argv<infer T> ? T : never;

// Per-type flag rejection list. Universal flags (--branch, --commit,
// --since, --until, --appmap) are accepted everywhere, as are output flags
// (--limit, --offset, --json). Other filter flags are accepted only on
// types where they make sense; flagging them on the wrong type is an
// error rather than a silent no-op.
const REJECTED_FLAGS: Record<FindType, readonly string[]> = {
  appmaps: ['class', 'method', 'label', 'event-id', 'table', 'exception', 'logger', 'message', 'with-logs'],
  requests: ['class', 'method', 'label', 'event-id', 'table', 'exception', 'logger', 'message', 'with-logs'],
  queries: ['label', 'event-id', 'exception', 'logger', 'message', 'with-logs'],
  calls: ['table', 'exception', 'logger', 'message', 'with-logs'],
  exceptions: ['class', 'method', 'label', 'event-id', 'duration', 'table', 'logger', 'message'],
  logs: ['class', 'method', 'label', 'event-id', 'route', 'status', 'duration', 'table', 'exception', 'with-logs'],
};

// Per-flag hints, attached to error messages when a rejected flag is used.
// Useful for nudging users toward the right flag (e.g., HTTP method
// belongs in --route, not --method, which is a function-method-name flag).
const REJECTED_HINTS: Partial<Record<FindType, Partial<Record<string, string>>>> = {
  requests: {
    method: 'to filter by HTTP method, use --route "METHOD /path"',
  },
  logs: {
    class: 'to filter logs by logger class, use --logger',
    label: '--label is implied (logs always means label=log)',
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
  const type = normalizeType(argv.type as string);
  validateFlags(type, argv);

  const filter: FindFilter = {};
  if (typeof argv.route === 'string') filter.route = argv.route;
  if (typeof argv.label === 'string') filter.label = argv.label;
  // yargs camelCases --event-id into argv.eventId; read the kebab key
  // too so direct test invocations don't depend on yargs coercion. A
  // single --event-id arrives as a scalar, repeated ones as an array.
  const eventIdArg = argv.eventId ?? argv['event-id'];
  if (Array.isArray(eventIdArg)) {
    const ids = eventIdArg.filter((n): n is number => typeof n === 'number');
    if (ids.length > 0) filter.eventIds = ids;
  } else if (typeof eventIdArg === 'number') {
    filter.eventIds = [eventIdArg];
  }
  if (typeof argv.branch === 'string') filter.branch = argv.branch;
  if (typeof argv.commit === 'string') filter.commit = argv.commit;
  if (typeof argv.status === 'string') filter.status = parseStatus(argv.status);
  if (typeof argv.duration === 'string') filter.duration = parseDuration(argv.duration);
  if (typeof argv.since === 'string') filter.since = parseTime(argv.since);
  if (typeof argv.until === 'string') filter.until = parseTime(argv.until);
  if (typeof argv.appmap === 'string') filter.appmap = argv.appmap;
  if (typeof argv.table === 'string') filter.table = argv.table;
  if (typeof argv.exception === 'string') filter.exception = argv.exception;
  if (typeof argv.logger === 'string') filter.logger = argv.logger;
  if (typeof argv.message === 'string') filter.message = argv.message;
  // yargs camelCases --with-logs into argv.withLogs and also keeps the
  // kebab-case key. Read both so direct test invocations don't have to
  // depend on yargs's coercion.
  const withLogs = argv.withLogs ?? argv['with-logs'];
  if (typeof withLogs === 'number') filter.withLogs = withLogs;
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
export const handler = lazyHandler(() => import('./findHandler'));
