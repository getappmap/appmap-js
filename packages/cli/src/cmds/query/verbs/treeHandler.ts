import yargs from 'yargs';
import { log } from 'console';

import { handleWorkingDirectory } from '../../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../../lib/locateAppMapDir';
import { verbose } from '../../../utils';
import { openReadOnly } from '../lib/openReadOnly';
import { tree, treeSummary, TreeOptions } from '../queries/tree';
import { renderFlat, renderSummary, renderTree } from '../lib/treeRender';
import { applyFilter } from './tree';
import type { Argv, TreeFilter } from './tree';

export default async function handler(argvIn: yargs.ArgumentsCamelCase<unknown>): Promise<void> {
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
      const f = argv.filter as TreeFilter;
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
    if (argv.focusFn) treeOptions.focusFn = argv.focusFn;
    if (argv.focusSql) treeOptions.focusSql = argv.focusSql;
    if (argv.focusRoute) treeOptions.focusRoute = argv.focusRoute;
    if (argv.focusUrl) treeOptions.focusUrl = argv.focusUrl;
    if (argv.ancestors !== undefined) treeOptions.ancestors = argv.ancestors;
    if (argv.descendants !== undefined) treeOptions.descendants = argv.descendants;
    if (argv.minElapsedMs !== undefined) treeOptions.minElapsedMs = argv.minElapsedMs;

    const nodes = tree(db, ref, treeOptions);
    const filtered = applyFilter(nodes, argv.filter as TreeFilter);
    if (argv.json) {
      log(JSON.stringify(filtered, null, 2));
    } else {
      const f = argv.filter as TreeFilter;
      log(f === 'all' ? renderTree(filtered) : renderFlat(filtered));
    }
  } finally {
    db.close();
  }
}
