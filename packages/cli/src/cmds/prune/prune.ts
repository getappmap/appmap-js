import Yargs from 'yargs';
import lazyHandler from '../../lib/lazyHandler';

export default {
  command: 'prune <file>',

  describe: 'Make an appmap file smaller by removing events',

  builder: (argv: Yargs.Argv) => {
    argv.option('output-dir', {
      describe: 'Specifies the output directory',
      type: 'string',
      default: '.',
      alias: 'o',
    });

    argv.option('format', {
      describe: 'How to format the output',
      choices: ['json', 'text'],
      default: 'text',
    });

    argv.positional('file', {
      describe: 'AppMap to prune',
    });

    argv.option('size', {
      describe: 'Prune input file to this size',
      default: '15mb',
      type: 'string',
      alias: 's',
    });

    argv.option('directory', {
      describe: 'Working directory for the command',
      type: 'string',
      alias: 'd',
    });

    argv.option('filter', {
      describe: 'Filter to use to prune the map',
      type: 'string',
    });

    argv.option('output-data', {
      describe: 'Whether to output all AppMap data or just output what was removed',
      type: 'boolean',
    });

    argv.option('auto', {
      describe:
        'Indicate whether the map was pruned automatically by the code editor extension/plugin',
      hidden: true,
    });
    return argv;
  },

  handler: lazyHandler(() => import('./pruneHandler')),
};
