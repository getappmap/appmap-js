import yargs from 'yargs';
import { log } from 'console';

import { handleWorkingDirectory } from '../../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../../lib/locateAppMapDir';
import { verbose } from '../../../utils';
import { openReadOnly } from '../lib/openReadOnly';
import { truncationFooter } from '../lib/page';
import { parseStatus, parseTime } from '../lib/parseFilter';
import {
  endpoints,
  EndpointSort,
  EndpointsFilter,
} from '../queries/endpoints';
import { formatCount, formatMs, formatPct, formatTable } from '../lib/format';
import type { Argv } from './endpoints';

export default async function handler(argvIn: yargs.ArgumentsCamelCase<unknown>): Promise<void> {
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
  if (argv.offset !== undefined) filter.offset = argv.offset;

  const db = openReadOnly(appmapDir, argv.queryDb);
  try {
    const page = endpoints(db, filter);
    if (argv.json) {
      log(JSON.stringify(page, null, 2));
      return;
    }
    log(
      formatTable(
        ['METHOD', 'ROUTE', 'COUNT', 'AVG', 'P95', 'ERR%'],
        page.rows.map((r) => [
          r.method,
          r.route,
          formatCount(r.count),
          formatMs(r.avg_ms),
          formatMs(r.p95_ms),
          formatPct(r.err_pct),
        ])
      )
    );
    const footer = truncationFooter(page);
    if (footer) log(footer);
  } finally {
    db.close();
  }
}
