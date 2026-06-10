import path from 'path';
import { log } from 'console';

import open from 'open';
import yargs from 'yargs';

import { handleWorkingDirectory } from '../../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../../lib/locateAppMapDir';
import { verbose } from '../../../utils';
import { openReadOnly } from '../lib/openReadOnly';
import { startUIServer } from '../lib/uiServer';

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

type Argv = ReturnType<typeof builder> extends yargs.Argv<infer T> ? T : never;

// Resolve the bundled SPA dir relative to the compiled JS location.
//   built/cmds/query/verbs/ui.js  →  built/html/query-ui
function defaultStaticDir(): string {
  return path.resolve(__dirname, '..', '..', '..', 'html', 'query-ui');
}

// Widened at the export so this module is assignable to CommandModule<T, any>.
export const handler = async (argvIn: yargs.ArgumentsCamelCase<unknown>): Promise<void> => {
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
};
