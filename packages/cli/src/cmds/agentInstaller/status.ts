import Yargs from 'yargs';
import chalk from 'chalk';
import lazyHandler from '../../lib/lazyHandler';

export default {
  command: 'status [directory]',
  aliases: ['s'],
  describe: 'Check the status of the current project for the AppMap language agent',
  async builder(args: Yargs.Argv) {
    const { INSTALLERS } = await import('./installers');

    // FIXME: This method takes advantage of the fact that each implementation returns a static string
    // as the installer name. In the future, this may not be the case. After all, `name` is a non-static
    // getter.
    const installerNames = INSTALLERS.map((installer) => chalk.blue(installer.prototype.name)).join(
      ', '
    );

    args.option('project-type', {
      describe: [
        'Specifies the status target. This may be a language or project framework. Case-insensitive.',
        `Supported project types: ${installerNames}`,
      ].join('\n'),
      type: 'string',
      default: undefined,
      alias: 'p',
    });
    args.positional('directory', {
      describe: 'directory to check',
      default: '.',
    });
    return args.strict();
  },

  handler: lazyHandler(() => import('./statusHandler')),
};
