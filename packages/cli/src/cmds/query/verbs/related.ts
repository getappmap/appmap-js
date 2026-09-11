import yargs from 'yargs';

import lazyHandler from '../../../lib/lazyHandler';

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

export type Argv = ReturnType<typeof builder> extends yargs.Argv<infer T> ? T : never;

// Widened at the export so this module is assignable to CommandModule<T, any>.
export const handler = lazyHandler(() => import('./relatedHandler'));
