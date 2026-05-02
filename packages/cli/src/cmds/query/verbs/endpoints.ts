import yargs from 'yargs';
import { log } from 'console';

import { handleWorkingDirectory } from '../../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../../lib/locateAppMapDir';
import { verbose } from '../../../utils';
import { openReadOnly } from '../lib/openReadOnly';
import { parseStatus, parseTime } from '../lib/parseFilter';
import {
  endpoints,
  EndpointSort,
  EndpointsFilter,
} from '../queries/endpoints';
import { formatCount, formatMs, formatPct, formatTable } from '../lib/format';

export const command = 'endpoints';
export const describe = 'Per-route summary table (orient verb)';

export const builder = <T>(args: yargs.Argv<T>) => {
  return args
    .option('directory', { type: 'string', alias: 'd', describe: 'program working directory' })
    .option('appmap-dir', { type: 'string', describe: 'directory of recordings' })
    .option('query-db', { type: 'string', describe: 'path to query.db (overrides default)' })
    .option('since', { type: 'string', describe: 'ISO timestamp or "Nd ago"' })
    .option('until', { type: 'string', describe: 'ISO timestamp or "Nd ago"' })
    .option('branch', { type: 'string' })
    .option('status', {
      type: 'string',
      describe:
        'route filter — e.g. 500, ">=500" (route is shown if any request matches; aggregates still cover all of that route\'s requests)',
    })
    .option('sort', {
      type: 'string',
      choices: ['count', 'avg', 'p95', 'err'] as const,
      default: 'count',
    })
    .option('limit', { type: 'number' })
    .option('json', { type: 'boolean', default: false });
};

type Argv = ReturnType<typeof builder> extends yargs.Argv<infer T> ? T : never;

// Widened at the export so this module is assignable to CommandModule<T, any>.
export const handler = async (argvIn: yargs.ArgumentsCamelCase<unknown>): Promise<void> => {
  const argv = argvIn as yargs.ArgumentsCamelCase<Argv>;
  verbose(argv.verbose as boolean | undefined);
  handleWorkingDirectory(argv.directory);
  // When --query-db is supplied, the appmap dir is irrelevant — the user has
  // already named a query.db. Otherwise, derive it from the appmap dir.
  const appmapDir = argv.queryDb ? '' : await locateAppMapDir(argv.appmapDir);

  const filter: EndpointsFilter = { sort: argv.sort as EndpointSort };
  if (argv.since) filter.since = parseTime(argv.since);
  if (argv.until) filter.until = parseTime(argv.until);
  if (argv.branch) filter.branch = argv.branch;
  if (argv.status) filter.status = parseStatus(argv.status);
  if (argv.limit !== undefined) filter.limit = argv.limit;

  const db = openReadOnly(appmapDir, argv.queryDb);
  try {
    const rows = endpoints(db, filter);
    if (argv.json) {
      log(JSON.stringify(rows, null, 2));
      return;
    }
    log(
      formatTable(
        ['METHOD', 'ROUTE', 'COUNT', 'AVG', 'P95', 'ERR%'],
        rows.map((r) => [
          r.method,
          r.route,
          formatCount(r.count),
          formatMs(r.avg_ms),
          formatMs(r.p95_ms),
          formatPct(r.err_pct),
        ])
      )
    );
  } finally {
    db.close();
  }
};
