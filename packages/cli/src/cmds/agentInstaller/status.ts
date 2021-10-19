import { promises as fs } from 'fs';
import Yargs from 'yargs';
import { resolve } from 'path';
import {
  ValidationError,
  AbortError,
  InstallError,
  ChildProcessError,
} from '../errors';
import { verbose } from '../../utils';
import AgentInstallerProcedure from './agentInstallerProcedure';
import chalk from 'chalk';
import UI from '../userInteraction';
import Telemetry from '../../telemetry';
import AgentInstaller from './agentInstaller';
import { ProcessLog } from './commandRunner';
import MavenInstaller from './mavenInstaller';
import GradleInstaller from './gradleInstaller';
import { PipInstaller, PoetryInstaller } from './pythonAgentInstaller';
import { BundleInstaller } from './rubyAgentInstaller';
import { INSTALLERS } from './install-agent';
import AgentStatusProcedure from './agentStatusProcedure';

interface InstallCommandOptions {
  verbose?: any;
  projectType?: string;
  directory: string;
}

export default {
  command: 'status [directory]',
  aliases: ['s'],
  describe: 'Check the status of the current project for the AppMap language agent',
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
    let installer: AgentInstaller | undefined;
    const installers = INSTALLERS.map(
      (constructor) => new constructor(directory)
    );

    verbose(isVerbose);

    try {
      const statusProcedure = new AgentStatusProcedure(
        installers,
        directory
      );
      await statusProcedure.run();
    }
    catch (e) {
      const err = e as Error;
      UI.error(err.message)
      Yargs.exit(1, err);
    }
  }
}
