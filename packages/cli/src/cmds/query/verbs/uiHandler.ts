import path from 'path';
import { log } from 'console';

import open from 'open';
import yargs from 'yargs';

import { handleWorkingDirectory } from '../../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../../lib/locateAppMapDir';
import { verbose } from '../../../utils';
import { openReadOnly } from '../lib/openReadOnly';
import { startUIServer } from '../lib/uiServer';
import type { Argv } from './ui';

// Resolve the bundled SPA dir relative to the compiled JS location.
//   built/cmds/query/verbs/uiHandler.js  →  built/html/query-ui
function defaultStaticDir(): string {
  return path.resolve(__dirname, '..', '..', '..', 'html', 'query-ui');
}

export default async function handler(argvIn: yargs.ArgumentsCamelCase<unknown>): Promise<void> {
  const argv = argvIn as yargs.ArgumentsCamelCase<Argv>;
  verbose(argv.verbose as boolean | undefined);
  handleWorkingDirectory(argv.directory);
  // When --query-db is supplied, the appmap dir is irrelevant — the user
  // has already named a query.db. Otherwise, derive it from the appmap dir.
  const appmapDir = argv.queryDb ? '' : await locateAppMapDir(argv.appmapDir);

  const db = openReadOnly(appmapDir, argv.queryDb);
  const handle = await startUIServer({
    db,
    port: argv.port,
    staticDir: defaultStaticDir(),
  });

  log(`appmap query ui listening on ${handle.url}`);
  if (argv.open) {
    // Best-effort. A failed browser launch shouldn't take down the server —
    // the URL is already printed above for the user to copy.
    void open(handle.url).catch(() => undefined);
  }

  // Keep the process alive until the user terminates it. The DB stays
  // open for the lifetime of the server; closing both on signal so the
  // file lock releases cleanly.
  const shutdown = (signal: string) => {
    log(`\nreceived ${signal}, shutting down`);
    handle
      .close()
      .catch(() => undefined)
      .finally(() => {
        db.close();
        process.exit(0);
      });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
