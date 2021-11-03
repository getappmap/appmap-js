import Yargs from 'yargs';
import { verbose } from '../../utils';
import chalk from 'chalk';
import UI from '../userInteraction';
import AgentInstaller from './agentInstaller';
import { INSTALLERS } from './installers';
import AgentStatusProcedure from './agentStatusProcedure';
import { getProjects } from './projectConfiguration';

interface InstallCommandOptions {
  verbose?: any;
  projectType?: string;
  directory: string;
}

export default {
  command: 'status [directory]',
  aliases: ['s'],
  describe:
    'Check the status of the current project for the AppMap language agent',
  builder(args: Yargs.Argv) {
    // FIXME: This method takes advantage of the fact that each implementation returns a static string
    // as the installer name. In the future, this may not be the case. After all, `name` is a non-static
    // getter.
    const installerNames = INSTALLERS.map((installer) =>
      chalk.blue(installer.prototype.name)
    ).join(', ');

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

  async handler(args: InstallCommandOptions) {
    const { projectType, directory, verbose: isVerbose } = args;
    const installers = INSTALLERS.map(
      (constructor) => new constructor(directory)
    );

    verbose(isVerbose);

    try {
      const [project] = await getProjects(
        installers,
        directory,
        false,
        projectType
      );

      const statusProcedure = new AgentStatusProcedure(
        project.selectedInstaller as AgentInstaller,
        directory
      );

      await statusProcedure.run();
    } catch (e) {
      const err = e as Error;
      UI.error(err.message);
      Yargs.exit(1, err);
    }
  },
};
