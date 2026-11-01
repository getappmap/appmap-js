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
import { validateFlags } from './hotspots';
import type { Argv } from './hotspots';

export default async function handler(argvIn: yargs.ArgumentsCamelCase<unknown>): Promise<void> {
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
}

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
