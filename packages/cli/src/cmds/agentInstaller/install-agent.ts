import Yargs from 'yargs';
import lazyHandler from '../../lib/lazyHandler';

export default {
  command: 'install [directory]',
  aliases: ['i', 'install-agent'],
  describe: 'Install and configure an AppMap language agent',
  async builder(args: Yargs.Argv) {
    const { INSTALLER_NAMES } = await import('./installers');

    args.option('project-type', {
      describe: [
        'Specifies the project dependency manager. Case-insensitive.',
        `Supported project types: ${INSTALLER_NAMES.join(', ')}`,
      ].join('\n'),
      type: 'string',
      default: undefined,
      alias: 'p',
    });

    args.option('directory', {
      describe: 'Directory in which to install.',
      type: 'string',
      alias: 'd',
    });

    args.option('interactive', {
      describe: `Whether to interact with the user (assuming there's a TTY).`,
      type: 'boolean',
      default: true,
    });

    args.option('overwrite-appmap-config', {
      describe: `Whether to overwrite the appmap.yml file.`,
      type: 'boolean',
    });

    args.option('installer-name', {
      describe: `Installer name to use, in case of ambiguity.`,
      type: 'string',
    });

    args.option('build-file', {
      describe: `Build file name to use, in case of ambiguity.`,
      type: 'string',
    });

    args.positional('directory', {
      describe: 'Directory in which to install (deprecated; use -d)',
      default: '.',
    });
    return args.strict();
  },

  handler: lazyHandler(() => import('./installAgentHandler')),
};
