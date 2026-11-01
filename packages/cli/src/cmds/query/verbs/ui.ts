import yargs from 'yargs';

import lazyHandler from '../../../lib/lazyHandler';

export const command = 'ui';
export const describe =
  'Launch a local web UI for browsing the query database (dashboard, endpoints, hotspots, traces)';

export const builder = <T>(args: yargs.Argv<T>) => {
  return args
    .option('directory', { type: 'string', alias: 'd', describe: 'program working directory' })
    .option('appmap-dir', { type: 'string', describe: 'directory of recordings' })
    .option('query-db', { type: 'string', describe: 'path to query.db (overrides default)' })
    .option('port', {
      type: 'number',
      describe: 'TCP port to listen on (default: random free port)',
    })
    .option('open', {
      type: 'boolean',
      default: true,
      describe: 'open the UI in the system browser on start (use --no-open to disable)',
    });
};

export type Argv = ReturnType<typeof builder> extends yargs.Argv<infer T> ? T : never;

// Widened at the export so this module is assignable to CommandModule<T, any>.
export const handler = lazyHandler(() => import('./uiHandler'));
