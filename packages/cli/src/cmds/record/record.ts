import yargs from 'yargs';
import lazyHandler from '../../lib/lazyHandler';

export default {
  command: 'record [mode]',
  describe: 'Create an AppMap via interactive recording, aka remote recording.',

  builder: (args: yargs.Argv) => {
    args.positional('mode', {
      type: 'string',
      choices: ['test', 'remote'],
    });

    args.option('directory', {
      describe: 'Working directory for the command.',
      type: 'string',
      alias: 'd',
    });

    args.option('appmap-config', {
      describe: 'AppMap config file to check for default options.',
      type: 'string',
      alias: 'c',
    });

    return args.strict();
  },

  handler: lazyHandler(() => import('./recordHandler')),
};
