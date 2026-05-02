import yargs from 'yargs';
import { log } from 'console';

import { handleWorkingDirectory } from '../../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../../lib/locateAppMapDir';
import { verbose } from '../../../utils';
import { openReadOnly } from '../lib/openReadOnly';
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
    .option('route', { type: 'string', describe: 'e.g. "GET /reports"' })
    .option('class', { type: 'string', describe: 'defined_class (function mode)' })
    .option('branch', { type: 'string' })
    .option('since', { type: 'string' })
    .option('until', { type: 'string' })
    .option('limit', { type: 'number' })
    .option('json', { type: 'boolean', default: false });
};

type Argv = ReturnType<typeof builder> extends yargs.Argv<infer T> ? T : never;

export const handler = async (argv: yargs.ArgumentsCamelCase<Argv>): Promise<void> => {
  verbose(argv.verbose as boolean | undefined);
  handleWorkingDirectory(argv.directory);
  const appmapDir = argv.queryDb ? '' : await locateAppMapDir(argv.appmapDir);

  const filter: HotspotsFilter = { type: argv.type as HotspotType };
  if (argv.route) filter.route = argv.route;
  if (argv.class) filter.className = argv.class;
  if (argv.branch) filter.branch = argv.branch;
  if (argv.since) filter.since = parseTime(argv.since);
  if (argv.until) filter.until = parseTime(argv.until);
  if (argv.limit !== undefined) filter.limit = argv.limit;

  const db = openReadOnly(appmapDir, argv.queryDb);
  try {
    const rows = hotspots(db, filter);
    if (argv.json) {
      log(JSON.stringify(rows, null, 2));
      return;
    }
    log(filter.type === 'sql' ? renderSql(rows as SqlHotspotRow[]) : renderFunctions(rows as FunctionHotspotRow[]));
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
