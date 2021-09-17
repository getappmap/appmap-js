import chalk from 'chalk';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import Yargs from 'yargs';

import { exists } from '../../utils';
import AgentInstaller from './agentInstaller';
import { AbortError, InstallError, ValidationError } from '../errors';
import { run } from './commandRunner';
import UI from '../userInteraction';

export default class AgentInstallerProcedure {
  constructor(
    readonly installers: readonly AgentInstaller[],
    readonly path: string
  ) {}

  async availableInstallers(): Promise<AgentInstaller[]> {
    const results = await Promise.all(
      this.installers.map(async (installer) => await installer.available())
    );

    return this.installers.filter((_, i) => results[i]);
  }

  async run(userSpecifiedInstaller?: string): Promise<AgentInstaller> {
    const availableInstallers = await this.availableInstallers();
    if (availableInstallers.length === 0) {
      const longestInstallerName = Math.max(
        ...this.installers.map((i) => i.name.length)
      );

      throw new ValidationError(
        [
          `No supported project was found in ${chalk.red(resolve(this.path))}.`,
          '',
          'The installation requirements for each project type are listed below:',
          this.installers
            .map(
              (i) =>
                `${chalk.blue(
                  i.name.padEnd(longestInstallerName + 2, ' ')
                )} ${chalk.yellow(`${i.buildFile} not found`)}`
            )
            .filter(Boolean)
            .join('\n'),
          '',
          `At least one of the requirements above must be satisfied to continue.`,
          '',
          `Change the current directory or specify another directory by using the ${chalk.blue(
            '-d'
          )} or ${chalk.blue('--dir')} command line argument.`,
          `Use ${chalk.blue('--help')} for more information.`,
        ].join('\n')
      );
    }

    let installer: AgentInstaller | undefined;
    if (userSpecifiedInstaller) {
      installer = this.installers.find(
        (i) => i.name.toLowerCase() === userSpecifiedInstaller.toLowerCase()
      );

      if (!installer) {
        const { willContinue } = await UI.prompt([
          {
            type: 'confirm',
            name: 'willContinue',
            prefix: chalk.yellow('!'),
            message: `${chalk.red(
              userSpecifiedInstaller
            )} is not a supported project type. However, installation may continue with: ${availableInstallers
              .map((i) => chalk.blue(i.name))
              .join(', ')}. Continue?`,
          },
        ]);

        if (!willContinue) {
          throw new AbortError(
            [
              `user attempted to install via \`${userSpecifiedInstaller}\` but aborted.`,
              `installers available: ${availableInstallers
                .map((i) => i.name)
                .join(', ')}`,
            ].join('\n')
          );
        }
      }
    }

    if (!installer) {
      if (availableInstallers.length === 1) {
        installer = availableInstallers[0];
      } else {
        const { installerName } = await UI.prompt({
          type: 'list',
          name: 'installerName',
          message: `Multiple project types were found in ${chalk.blue(
            resolve(this.path)
          )}. Select one to continue.`,
          choices: availableInstallers.map((i) => i.name),
        });

        installer = availableInstallers.find((i) => i.name === installerName);
      }
    }

    if (!installer) {
      // This should branch should never occur
      throw new ValidationError(`Invalid selection`);
    }

    try {
      let env = {
        'Project type': installer.name,
        'Project directory': resolve(this.path),
      };

      if (installer.environment) {
        env = { ...env, ...(await installer.environment()) };
      }

      const { confirm } = await UI.prompt({
        type: 'confirm',
        name: 'confirm',
        message: [
          `AppMap is about to be installed. Confirm the details below.`,
          Object.entries(env).map(
            ([key, value]) => `  ${chalk.blue(key)}: ${value.trim()}`
          ),
          '',
          '  Is this correct?',
        ]
          .flat()
          .join('\n'),
      });

      if (!confirm) {
        UI.status = 'Aborting installation.';
        UI.error(
          [
            'Modify the installation environment as needed, and re-run the command.',
            `Use ${chalk.blue('--help')} for more information.`,
          ].join('\n')
        );
        throw new AbortError(
          'aborted while confirming installation environment'
        );
      }

      let writeAppMapYml = true;
      if (await exists(join(this.path, 'appmap.yml'))) {
        const USE_EXISTING = 'Use existing';
        const OVERWRITE = 'Overwrite';
        const ABORT = 'Abort';

        const { overwriteAppMapYml } = await UI.prompt({
          type: 'list',
          name: 'overwriteAppMapYml',
          message:
            'An appmap.yml configuration file already exists. How should the conflict be resolved?',
          choices: [USE_EXISTING, OVERWRITE, ABORT],
        });

        if (overwriteAppMapYml === ABORT) {
          Yargs.exit(0, new Error());
        }

        if (overwriteAppMapYml === USE_EXISTING) {
          writeAppMapYml = false;
        }
      }

      UI.status = 'Installing the AppMap agent...';

      await installer.installAgent();

      if (installer.verifyCommand) {
        const cmd = await installer.verifyCommand();
        await run(cmd);
      }

      if (writeAppMapYml) {
        const initCommand = await installer.initCommand();
        const { stdout } = await run(initCommand);
        const json = JSON.parse(stdout);

        await fs.writeFile(
          join(this.path, 'appmap.yml'),
          json.configuration.contents
        );
      }

      if (installer.validateAgentCommand) {
        UI.status = 'Validating the AppMap agent...';

        const cmd = await installer.validateAgentCommand();
        try {
          await run(cmd);
        } catch (e) {
          UI.error('Failed to validate the installation.');
          throw e;
        }
      }

      const successMessage = [
        chalk.green('Success! The AppMap agent has been installed.'),
      ];

      if (installer.postInstallMessage) {
        successMessage.push('', await installer.postInstallMessage(), '');
      }

      if (installer.documentation) {
        successMessage.push(
          'For more information, visit',
          chalk.blue(installer.documentation)
        );
      }

      UI.success(successMessage.join('\n'));

      return installer;
    } catch (e) {
      throw new InstallError(e, installer);
    }
  }
}
