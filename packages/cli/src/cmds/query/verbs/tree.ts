import yargs from 'yargs';
import { log } from 'console';

import { handleWorkingDirectory } from '../../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../../lib/locateAppMapDir';
import { verbose } from '../../../utils';
import { openReadOnly } from '../lib/openReadOnly';
import { tree, treeSummary, TreeNode, TreeOptions } from '../queries/tree';
import { renderFlat, renderSummary, renderTree } from '../lib/treeRender';

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
      choices: ['all', 'http', 'sql'] as const,
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
      describe: 'descendant levels below each focus match (default 3)',
    })
    .option('min-elapsed-ms', {
      type: 'number',
      describe: 'prune subtrees whose max elapsed is below this threshold',
    })
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

  const db = openReadOnly(appmapDir, argv.queryDb);
  try {
    if (argv.format === 'summary') {
      // The summary aggregates over all event types; combining with
      // --filter would be ambiguous, so reject rather than silently drop.
      const f = argv.filter as 'all' | 'http' | 'sql';
      if (f !== 'all') {
        throw new Error(
          'tree --format=summary does not accept --filter; remove one of them'
        );
      }
      const s = treeSummary(db, ref);
      if (argv.json) log(JSON.stringify(s, null, 2));
      else log(renderSummary(s));
      return;
    }

    const treeOptions: TreeOptions = {};
    if (argv.focusFn) treeOptions.focusFn = argv.focusFn as string;
    if (argv.focusSql) treeOptions.focusSql = argv.focusSql as string;
    if (argv.focusRoute) treeOptions.focusRoute = argv.focusRoute as string;
    if (argv.focusUrl) treeOptions.focusUrl = argv.focusUrl as string;
    if (argv.ancestors !== undefined) treeOptions.ancestors = argv.ancestors as number;
    if (argv.descendants !== undefined) treeOptions.descendants = argv.descendants as number;
    if (argv.minElapsedMs !== undefined) treeOptions.minElapsedMs = argv.minElapsedMs as number;

    const nodes = tree(db, ref, treeOptions);
    const filtered = applyFilter(nodes, argv.filter as 'all' | 'http' | 'sql');
    if (argv.json) {
      log(JSON.stringify(filtered, null, 2));
    } else {
      const f = argv.filter as 'all' | 'http' | 'sql';
      log(f === 'all' ? renderTree(filtered) : renderFlat(filtered));
    }
  } finally {
    db.close();
  }
};

function applyFilter(nodes: readonly TreeNode[], filter: 'all' | 'http' | 'sql'): TreeNode[] {
  if (filter === 'all') return [...nodes];
  if (filter === 'sql') return nodes.filter((n) => n.kind === 'sql');
  // 'http' — both inbound and outbound
  return nodes.filter((n) => n.kind === 'http_server' || n.kind === 'http_client');
}
