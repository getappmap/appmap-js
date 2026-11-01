import yargs from 'yargs';
import lazyHandler from '../../lib/lazyHandler';

export const command = 'stats [directory]';
export const describe =
  'Show statistics about events from an AppMap or from all AppMaps in a directory';
const LIMIT_DEFAULT = 10;

export const builder = (args: yargs.Argv) => {
  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });
  args.option('appmap-dir', {
    describe: 'directory to recursively inspect for AppMaps',
  });

  args.option('format', {
    describe: 'How to format the output',
    choices: ['json', 'text'],
    alias: 'f',
    default: 'text',
  });

  args.option('limit', {
    describe: 'Number of methods to display',
    type: 'number',
    alias: 'l',
    default: LIMIT_DEFAULT,
  });

  args.option('appmap-file', {
    describe: 'AppMap to analyze',
    type: 'string',
    alias: 'a',
  });

  return args.strict();
};

export const handler = lazyHandler(() => import('./statsHandler'));

export default {
  command: command,
  describe: describe,
  builder: builder,
  handler: handler,
};
