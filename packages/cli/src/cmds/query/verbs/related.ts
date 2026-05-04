import yargs from 'yargs';
import { log } from 'console';

import { handleWorkingDirectory } from '../../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../../lib/locateAppMapDir';
import { verbose } from '../../../utils';
import { openReadOnly } from '../lib/openReadOnly';
import { truncationFooter } from '../lib/page';
import { parseStatus, parseTime } from '../lib/parseFilter';
import { related, RelatedFilter, RelatedRow } from '../queries/related';
import { formatCount, formatMs, formatTable } from '../lib/format';

export const command = 'related <appmap>';
export const describe = 'Rank recordings similar to <appmap>';

export const builder = <T>(args: yargs.Argv<T>) => {
  return args
    .positional('appmap', { type: 'string', describe: 'source appmap (name or basename)' })
    .option('directory', { type: 'string', alias: 'd' })
    .option('appmap-dir', { type: 'string' })
    .option('query-db', { type: 'string', describe: 'path to query.db (overrides default)' })
    .option('branch', { type: 'string' })
    .option('commit', { type: 'string' })
    .option('since', { type: 'string' })
    .option('until', { type: 'string' })
    .option('status', {
      type: 'string',
      describe:
        'route filter — e.g. 200, ">=500" (route is shown if any request matches)',
    })
    .option('route', {
      type: 'string',
      describe: 'e.g. "POST /orders" (path is exact match; method case-insensitive)',
    })
    .option('limit', { type: 'number', describe: 'default 20; pass 0 for unbounded' })
    .option('offset', { type: 'number' })
    .option('json', { type: 'boolean', default: false });
};

type Argv = ReturnType<typeof builder> extends yargs.Argv<infer T> ? T : never;

// Widened at the export so this module is assignable to CommandModule<T, any>.
export const handler = async (argvIn: yargs.ArgumentsCamelCase<unknown>): Promise<void> => {
  const argv = argvIn as yargs.ArgumentsCamelCase<Argv>;
  verbose(argv.verbose as boolean | undefined);
  handleWorkingDirectory(argv.directory);
  const appmapDir = argv.queryDb ? '' : await locateAppMapDir(argv.appmapDir);

  const ref = argv.appmap;
  if (!ref) throw new Error('<appmap> is required');

  const filter: RelatedFilter = {};
  if (argv.branch) filter.branch = argv.branch;
  if (argv.commit) filter.commit = argv.commit;
  if (argv.since) filter.since = parseTime(argv.since);
  if (argv.until) filter.until = parseTime(argv.until);
  if (argv.status) filter.status = parseStatus(argv.status);
  if (argv.route) filter.route = argv.route;
  if (argv.limit !== undefined) filter.limit = argv.limit;
  if (argv.offset !== undefined) filter.offset = argv.offset;

  const db = openReadOnly(appmapDir, argv.queryDb);
  try {
    const page = related(db, ref, filter);
    if (argv.json) {
      log(JSON.stringify(page, null, 2));
      return;
    }
    log(renderRelated(page.rows));
    const footer = truncationFooter(page);
    if (footer) log(footer);
  } finally {
    db.close();
  }
};

function renderRelated(rows: readonly RelatedRow[]): string {
  return formatTable(
    ['APPMAP', 'SCORE', 'ROUTE', 'STATUS', 'ELAPSED', 'SHARED'],
    rows.map((r) => [
      r.appmap_name,
      formatCount(r.score),
      r.method && r.route ? `${r.method} ${r.route}` : r.route ?? '',
      r.status_code != null ? String(r.status_code) : '',
      formatMs(r.elapsed_ms),
      r.shared.join(', '),
    ])
  );
}
