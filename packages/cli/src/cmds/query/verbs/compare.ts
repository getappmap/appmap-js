import yargs from 'yargs';
import { log } from 'console';

import { handleWorkingDirectory } from '../../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../../lib/locateAppMapDir';
import { verbose } from '../../../utils';
import { openReadOnly } from '../lib/openReadOnly';
import { truncationFooter } from '../lib/page';
import { parseTime } from '../lib/parseFilter';
import {
  compare,
  CompareFilter,
  CompareRow,
  CompareSort,
} from '../queries/compare';
import { formatCount, formatMs, formatTable } from '../lib/format';

export const command = 'compare <branch-a> <branch-b>';
export const describe = 'Per-route latency delta between two branches';

export const builder = <T>(args: yargs.Argv<T>) => {
  return args
    .positional('branch-a', { type: 'string', describe: 'baseline branch' })
    .positional('branch-b', { type: 'string', describe: 'comparison branch' })
    .option('directory', { type: 'string', alias: 'd' })
    .option('appmap-dir', { type: 'string' })
    .option('query-db', { type: 'string', describe: 'path to query.db (overrides default)' })
    .option('since', { type: 'string' })
    .option('until', { type: 'string' })
    .option('sort', {
      type: 'string',
      choices: ['delta', 'p95-a', 'p95-b'] as const,
      default: 'delta',
    })
    .option('include-counts', { type: 'boolean', default: false })
    .option('limit', { type: 'number', describe: 'default 20; pass 0 for unbounded' })
    .option('offset', { type: 'number' })
    .option('json', { type: 'boolean', default: false });
};

type Argv = ReturnType<typeof builder> extends yargs.Argv<infer T> ? T : never;

export const handler = async (argvIn: yargs.ArgumentsCamelCase<unknown>): Promise<void> => {
  const argv = argvIn as yargs.ArgumentsCamelCase<Argv>;
  verbose(argv.verbose as boolean | undefined);
  handleWorkingDirectory(argv.directory);
  const appmapDir = argv.queryDb ? '' : await locateAppMapDir(argv.appmapDir);

  const branchA = argv.branchA;
  const branchB = argv.branchB;
  if (!branchA || !branchB) throw new Error('<branch-a> and <branch-b> are required');

  const filter: CompareFilter = {
    branch_a: branchA,
    branch_b: branchB,
    sort: argv.sort as CompareSort,
  };
  if (argv.since) filter.since = parseTime(argv.since);
  if (argv.until) filter.until = parseTime(argv.until);
  if (argv.limit !== undefined) filter.limit = argv.limit;
  if (argv.offset !== undefined) filter.offset = argv.offset;

  const db = openReadOnly(appmapDir, argv.queryDb);
  try {
    const page = compare(db, filter);
    if (argv.json) {
      log(JSON.stringify(page, null, 2));
      return;
    }
    log(renderCompare(page.rows, branchA, branchB, !!argv.includeCounts));
    const footer = truncationFooter(page);
    if (footer) log(footer);
  } finally {
    db.close();
  }
};

// Format a delta ratio (b_p95 / a_p95) for display:
//   ~                if 0.8 ≤ ratio ≤ 1.25 (no meaningful change)
//   +Nx / -Nx        for ≥2× or ≤0.5
//   +N% / -N%        otherwise
//   ?                if delta is null
function formatDelta(d: number | null): string {
  if (d == null) return '?';
  if (d >= 0.8 && d <= 1.25) return '~';
  if (d >= 2) return `+${d.toFixed(1)}×`;
  if (d <= 0.5) return `-${(1 / d).toFixed(1)}×`;
  const pct = (d - 1) * 100;
  return `${pct > 0 ? '+' : ''}${pct.toFixed(0)}%`;
}

function renderCompare(
  rows: readonly CompareRow[],
  branchA: string,
  branchB: string,
  includeCounts: boolean
): string {
  if (includeCounts) {
    return formatTable(
      ['ROUTE', `${branchA}_p95`, `${branchA}_n`, `${branchB}_p95`, `${branchB}_n`, 'Δ'],
      rows.map((r) => [
        `${r.method} ${r.route}`,
        formatMs(r.a_p95_ms),
        formatCount(r.a_count),
        formatMs(r.b_p95_ms),
        formatCount(r.b_count),
        formatDelta(r.delta),
      ])
    );
  }
  return formatTable(
    ['ROUTE', `${branchA}_p95`, `${branchB}_p95`, 'Δ'],
    rows.map((r) => [
      `${r.method} ${r.route}`,
      formatMs(r.a_p95_ms),
      formatMs(r.b_p95_ms),
      formatDelta(r.delta),
    ])
  );
}
