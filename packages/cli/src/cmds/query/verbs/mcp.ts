import yargs from 'yargs';

import lazyHandler from '../../../lib/lazyHandler';

export const command = 'mcp';
export const describe =
  'Run an MCP (Model Context Protocol) server on stdio that exposes the query verbs as tools';

export const builder = <T>(args: yargs.Argv<T>) => {
  return args
    .option('directory', { type: 'string', alias: 'd' })
    .option('appmap-dir', { type: 'string' })
    .option('query-db', {
      type: 'string',
      describe: 'path to query.db (overrides default)',
    });
};

export type Argv = ReturnType<typeof builder> extends yargs.Argv<infer T> ? T : never;

// Widened at the export so this module is assignable to CommandModule<T, any>.
export const handler = lazyHandler(() => import('./mcpHandler'));
