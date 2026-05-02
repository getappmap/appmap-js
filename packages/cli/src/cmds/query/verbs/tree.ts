import yargs from 'yargs';
import { log } from 'console';

import { handleWorkingDirectory } from '../../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../../lib/locateAppMapDir';
import { verbose } from '../../../utils';
import { openReadOnly } from '../lib/openReadOnly';
import { tree, treeSummary, TreeNode } from '../queries/tree';
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
    .option('json', { type: 'boolean', default: false });
};

type Argv = ReturnType<typeof builder> extends yargs.Argv<infer T> ? T : never;

export const handler = async (argv: yargs.ArgumentsCamelCase<Argv>): Promise<void> => {
  verbose(argv.verbose as boolean | undefined);
  handleWorkingDirectory(argv.directory);
  const appmapDir = argv.queryDb ? '' : await locateAppMapDir(argv.appmapDir);

  const ref = argv.appmap;
  if (!ref) throw new Error('<appmap> is required');

  const db = openReadOnly(appmapDir, argv.queryDb);
  try {
    if (argv.format === 'summary') {
      const s = treeSummary(db, ref);
      if (argv.json) log(JSON.stringify(s, null, 2));
      else log(renderSummary(s));
      return;
    }

    const nodes = tree(db, ref);
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
