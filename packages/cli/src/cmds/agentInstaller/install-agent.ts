import { isNativeError } from 'node:util/types';

import Yargs from 'yargs';
import { promises as fs, statSync } from 'fs';
import {
  AbortError,
  ChildProcessError,
  InvalidPathError,
  ValidationError,
  UserConfigError,
} from '../errors';
import { endTime, prefixLines, verbose } from '../../utils';
import AgentInstallerProcedure from './agentInstallerProcedure';
import chalk from 'chalk';
import { Telemetry } from '@appland/telemetry';
import { INSTALLERS, INSTALLER_NAMES } from './installers';
import { getProjects, ProjectConfiguration } from './projectConfiguration';
import AgentInstaller from './agentInstaller';
import { ProcessLog } from './commandRunner';
import openTicket from '../../lib/ticket/openTicket';
import InstallerUI from './installerUI';

interface InstallCommandOptions {
  verbose?: any;
  projectType?: string;
  directory: string;
  interactive: boolean;
  overwriteAppmapConfig?: boolean;
  installerName?: string;
  buildFile?: string;
}

class InstallerError extends Error {
  readonly error: Error;
  readonly log: string;

  constructor(error: unknown, readonly duration: number, readonly project?: ProjectConfiguration) {
    super();
    this.error = isNativeError(error) ? error : new Error(String(error));
    this.log = ProcessLog.consumeBuffer();
  }

  get message(): string {
    if (this.error instanceof ValidationError || this.error instanceof ChildProcessError) {
      return this.error.message;
    } else if (isNativeError(this.error)) {
      return this.error.stack || String(this.error);
    }

    return String(this.error);
  }

  async handle(ui: InstallerUI): Promise<boolean> {
    ui.error();

    const installersAvailable = this.project?.availableInstallers.map((i) => i.name).join(', ');

    if (this.error instanceof AbortError) {
      ui.error(`${chalk.yellow('!')} Installation has been aborted.`);
      return true;
    } else if (this.error instanceof InvalidPathError) {
      ui.error(`${chalk.red('!')} ${this.error.message}`);
      return true;
    } else if (this.error instanceof UserConfigError) {
      ui.error(`${chalk.red('!')} Error in project configuration:\n\n${this.error?.message}`);
      return true;
    } else {
      let exception: string | undefined;
      if (this.error instanceof Error) {
        exception = this.error.stack;
      } else {
        exception = String(this.error);
      }

      let directoryContents: string | undefined;
      if (this.project?.path) {
        try {
          directoryContents = (await fs.readdir(this.project.path)).join('\n');
        } catch (e) {
          if (e instanceof Error) {
            directoryContents = e.stack;
          } else {
            directoryContents = String(e);
          }
        }
      }
    }
    return false;
  }
}

const handler = async (
  args: InstallCommandOptions
): Promise<{ exitCode: number; err: Error | null }> => {
  const {
    projectType,
    directory,
    verbose: isVerbose,
    interactive: interactiveArg,
    overwriteAppmapConfig: overwriteAppMapConfig,
    installerName,
    buildFile,
  } = args;
  const errors: InstallerError[] = [];
  const installers = INSTALLERS.map((constructor) => new constructor(directory));

  verbose(isVerbose);

  const interactive = interactiveArg !== undefined ? interactiveArg : process.stdout.isTTY;
  const ui = new InstallerUI(interactive, { overwriteAppMapConfig, installerName, buildFile });

  try {
    const stats = statSync(directory, { throwIfNoEntry: false });
    if (!stats?.isDirectory()) {
      const msg = `${directory} does not exist or is not a directory.`;
      console.error(`ERROR: ${msg}`);
      return {
        exitCode: 1,
        err: new InvalidPathError(msg),
      };
    }

    const projects = await getProjects(ui, installers, directory, true, projectType);

    const noopsInvoked = new Set<string>();
    for (const project of projects) {
      if (project.selectedInstaller?.isNoop) {
        // make sure we're not duplicating messages
        if (noopsInvoked.has(project.selectedInstaller.name)) continue;
        // just give the installer a chance to print a message
        await project.selectedInstaller.installAgent(ui);
        noopsInvoked.add(project.selectedInstaller.name);
        continue;
      }

      const installProcedure = new AgentInstallerProcedure(
        project.selectedInstaller!,
        project.path
      );

      ui.message(`Installing AppMap agent for ${chalk.blue(project.name)}...`);

      try {
        await installProcedure.run(ui);
      } catch (e) {
        let installerError = new InstallerError(e, endTime(), project);
        const handled = await installerError.handle(ui);
        if (handled) {
          return { exitCode: 1, err: e as Error };
        }
        errors.push(installerError);
      }
    }

    if (errors.length) {
      const message =
        projects.length === 1
          ? 'Installation failed. View error details?'
          : `${errors.length} out of ${projects.length} installations failed. View error details?`;

      if (await ui.shouldShowError(message)) {
        errors.forEach((error) => {
          ui.error(
            projects.length > 1
              ? prefixLines(error.message, `[${chalk.red(error.project?.name)}] `)
              : error.message
          );
        });
      }
    }
  } catch (err) {
    const installerError = new InstallerError(err, 0, undefined);
    const handled = await installerError.handle(ui);
    if (handled) {
      return { exitCode: 1, err: err as Error };
    }
    errors.push(installerError);
  }

  if (errors.length) {
    if (ui.interactive) await openTicket(errors.map((e) => e.message));

    const reason = new Error(errors.map((e) => e.message).join('\n'));
    return { exitCode: 1, err: reason };
  }

  return { exitCode: 0, err: null };
};

export default {
  command: 'install [directory]',
  aliases: ['i', 'install-agent'],
  describe: 'Install and configure an AppMap language agent',
  builder(args: Yargs.Argv) {
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

  async handler(args: InstallCommandOptions): Promise<void> {
    const { exitCode, err } = await handler(args);

    Telemetry.flush(() => {
      Yargs.exit(exitCode, err as any);
    });
  },
};
