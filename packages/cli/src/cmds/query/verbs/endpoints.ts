import yargs from 'yargs';

import lazyHandler from '../../../lib/lazyHandler';

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
    .option('limit', { type: 'number', describe: 'default 20; pass 0 for unbounded' })
    .option('offset', { type: 'number' })
    .option('json', { type: 'boolean', default: false });
};

export type Argv = ReturnType<typeof builder> extends yargs.Argv<infer T> ? T : never;

// Widened at the export so this module is assignable to CommandModule<T, any>.
export const handler = lazyHandler(() => import('./endpointsHandler'));
