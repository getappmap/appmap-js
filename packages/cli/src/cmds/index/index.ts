import yargs from 'yargs';

import lazyHandler from '../../lib/lazyHandler';

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
  args.option('query-db', {
    describe: 'path to query.db (overrides default ~/.appmap/data/<sha>/query.db)',
    type: 'string',
  });
  args.option('navie-provider', {
    describe: 'navie provider to use',
    type: 'string',
    choices: ['local', 'remote'],
    deprecated: "only local provider is supported",
  });
  args.option('log-navie', {
    describe: 'Log Navie events to stderr',
    boolean: true,
    default: false,
  });

  return args.strict();
};

export const handler = lazyHandler(() => import('./indexHandler'));
