import readline from 'readline';
import yargs from 'yargs';
import jayson from 'jayson';

import FingerprintDirectoryCommand from '../../fingerprint/fingerprintDirectoryCommand';
import FingerprintWatchCommand from '../../fingerprint/fingerprintWatchCommand';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../lib/locateAppMapDir';
import { verbose } from '../../utils';
import searchSingleAppMap from '../search/searchSingleAppMap';
import searchAppMaps from '../search/searchAppMaps';
import { warn } from 'console';
import { buildAppMap, deserializeFilter } from '@appland/models';
import { readFile } from 'fs/promises';

export const command = 'index';
export const describe =
  'Compute fingerprints and update index files for all appmaps in a directory';

export const builder = (args: yargs.Argv) => {
  args.showHidden();

  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });
  args.option('appmap-dir', {
    describe: 'directory to recursively inspect for AppMaps',
  });
  args.option('watch', {
    describe: 'watch the directory for changes to appmaps',
    boolean: true,
    alias: 'w',
  });
  args.option('port', {
    describe: 'port to listen on for JSON-RPC requests',
    type: 'number',
    alias: 'p',
  });
  args.options('watch-stat-delay', {
    type: 'number',
    default: 10,
    describe: 'delay between stat calls when watching, in milliseconds',
    hidden: true,
  });
  return args.strict();
};

export const handler = async (argv) => {
  verbose(argv.verbose);
  handleWorkingDirectory(argv.directory);
  const appmapDir = await locateAppMapDir(argv.appmapDir);

  const { watchStatDelay } = argv;

  if (argv.watch) {
    const { port } = argv;

    warn(`Running indexer in watch mode`);
    const cmd = new FingerprintWatchCommand(appmapDir);
    await cmd.execute(watchStatDelay);

    if (port) {
      warn(`Running JSON-RPC server on port ${port}`);
      const rpc_searchAppMaps = (args, callback) => {
        warn(`Handling JSON-RPC request for search.appmaps (${JSON.stringify(args)})`);
        const { query, options } = args;
        searchAppMaps(appmapDir, query, options || {})
          .then((result) => callback(null, result))
          .catch((err) => callback({ code: 500, message: err.message }));
      };

      const rpc_searchEvents = (args, callback) => {
        warn(`Handling JSON-RPC request for search.codeObjects (${JSON.stringify(args)})`);
        const { appmap, query, options } = args;
        searchSingleAppMap(appmap, query, options || {})
          .then((result) => callback(null, result))
          .catch((err) => callback({ code: 500, message: err.message }));
      };

      const rpc_indexNumProcessed = (args, callback) => {
        warn(`Handling JSON-RPC request for index.numProcessed (${JSON.stringify(args)})`);
        callback(null, cmd.numProcessed);
      };

      const rpc_appmapFilter = (args, callback) => {
        warn(`Handling JSON-RPC request for appmap.filter (${JSON.stringify(args)})`);
        let { appmap: appmapId } = args;
        const { filter: filterArg } = args;

        const loadFilterObj = () => {
          if (typeof filterArg === 'object') return filterArg;
        };

        const loadFilterString = () => {
          try {
            return deserializeFilter(filterArg);
          } catch (err) {
            return null;
          }
        };

        const filter = loadFilterString() || loadFilterObj();
        if (!filter) {
          callback({ code: 422, message: 'Invalid filter' });
          return;
        }

        if (!appmapId.endsWith('.appmap.json')) appmapId = appmapId + '.appmap.json';
        readFile(appmapId, 'utf8')
          .then((appmapStr) => {
            const appmap = buildAppMap().source(appmapStr).build();
            const filteredAppMap = filter.filter(appmap, []);
            callback(null, filteredAppMap);
          })
          .catch((err) => callback({ code: 500, message: err.message }));
      };

      const rpcMethods = {
        'search.appmaps': rpc_searchAppMaps,
        'search.events': rpc_searchEvents,
        'index.numProcessed': rpc_indexNumProcessed,
        'appmap.filter': rpc_appmapFilter,
      };

      const server = new jayson.Server(rpcMethods);
      server.http().listen(port);
    } else {
      if (!argv.verbose && process.stdout.isTTY) {
        process.stdout.write('\x1B[?25l');
        const consoleLabel = 'AppMaps processed: 0';
        process.stdout.write(consoleLabel);
        setInterval(() => {
          readline.cursorTo(process.stdout, consoleLabel.length - 1);
          process.stdout.write(`${cmd.numProcessed}`);
        }, 1000);
      }
    }
  } else {
    const cmd = new FingerprintDirectoryCommand(appmapDir);
    await cmd.execute();
  }
};
