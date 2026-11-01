import yargs from 'yargs';

import lazyHandler from '../lib/lazyHandler';

export const command = 'depends [files]';
export const describe = 'Compute a list of AppMaps that are out of date';

export const builder = (args: yargs.Argv) => {
  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });
  args.positional('files', {
    describe: 'provide an explicit list of dependency files',
  });
  args.option('appmap-dir', {
    describe: 'directory to recursively inspect for AppMaps',
  });
  args.option('base-dir', {
    describe: 'directory to prepend to each dependency source file',
    default: '.',
  });
  args.option('field', {
    describe: 'print a field from each matching AppMap',
  });
  args.option('stdin-files', {
    describe: 'read the list of changed files from stdin, one file per line',
    boolean: true,
  });
  return args.strict();
};

export const handler = lazyHandler(() => import('./dependsHandler'));
