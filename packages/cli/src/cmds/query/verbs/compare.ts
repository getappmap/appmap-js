import yargs from 'yargs';

import lazyHandler from '../../../lib/lazyHandler';

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

export type Argv = ReturnType<typeof builder> extends yargs.Argv<infer T> ? T : never;

export const handler = lazyHandler(() => import('./compareHandler'));
