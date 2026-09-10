import yargs from 'yargs';

import lazyHandler from '../../../lib/lazyHandler';
import type { TreeNode } from '../queries/tree';

export const command = 'tree <appmap>';
export const describe = 'Render the call tree of one recording';

export const builder = <T>(args: yargs.Argv<T>) => {
  return args
    .positional('appmap', { type: 'string', describe: 'appmap name (or basename of source path)' })
    .option('directory', { type: 'string', alias: 'd' })
    .option('appmap-dir', { type: 'string' })
    .option('query-db', { type: 'string', describe: 'path to query.db' })
    .option('format', {
      type: 'string',
      choices: ['tree', 'summary'] as const,
      default: 'tree',
    })
    .option('filter', {
      type: 'string',
      choices: ['all', 'http', 'sql', 'logs'] as const,
      default: 'all',
    })
    .option('focus-fn', {
      type: 'string',
      describe: 'centre on function calls matching this fqid',
    })
    .option('focus-sql', {
      type: 'string',
      describe: 'centre on SQL queries containing this substring',
    })
    .option('focus-route', {
      type: 'string',
      describe: 'centre on a server request matching this normalized path',
    })
    .option('focus-url', {
      type: 'string',
      describe: 'centre on an outbound HTTP call whose URL contains this substring',
    })
    .option('ancestors', {
      type: 'number',
      describe: 'ancestor levels to keep above each focus match (default 5)',
    })
    .option('descendants', {
      type: 'number',
      describe: 'descendant levels below each focus match (default 4)',
    })
    .option('min-elapsed-ms', {
      type: 'number',
      describe: 'prune subtrees whose max elapsed is below this threshold',
    })
    .option('json', { type: 'boolean', default: false });
};

export type Argv = ReturnType<typeof builder> extends yargs.Argv<infer T> ? T : never;

// Widened at the export so this module is assignable to CommandModule<T, any>.
export const handler = lazyHandler(() => import('./treeHandler'));

export type TreeFilter = 'all' | 'http' | 'sql' | 'logs';

export function applyFilter(nodes: readonly TreeNode[], filter: TreeFilter): TreeNode[] {
  switch (filter) {
    case 'all':
      return [...nodes];
    case 'sql':
      return nodes.filter((n) => n.kind === 'sql');
    case 'logs':
      return nodes.filter((n) => n.kind === 'log');
    case 'http':
      return nodes.filter((n) => n.kind === 'http_server' || n.kind === 'http_client');
  }
}
