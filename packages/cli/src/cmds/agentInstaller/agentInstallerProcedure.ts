import chalk from 'chalk';
import fs from 'fs';
import { resolve } from 'path';
import Yargs from 'yargs';

import AgentInstaller from './agentInstaller';
import { AbortError, InstallError, ValidationError } from '../errors';
import { run } from './commandRunner';
import UI from '../userInteraction';
import AgentProcedure from './agentProcedure';

export default class AgentInstallerProcedure extends AgentProcedure {
  async run(userSpecifiedInstaller?: string): Promise<AgentInstaller> {
    const availableInstallers = await this.getInstallersForProject();

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
        installer = await this.chooseInstaller(availableInstallers);
      }
    }
    if (!installer) {
      // This should branch should never occur
      throw new ValidationError(`Invalid selection`);
    }

    try {

      const { confirm } = await UI.prompt({
        type: 'confirm',
        name: 'confirm',
        message: [
          `AppMap is about to be installed. Confirm the details below.`,
          await this.getEnvironmentForDisplay(installer),
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

      let useExistingAppMapYml = false;
      if (this.configExists) {
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
          useExistingAppMapYml = true;
        }
      }

      UI.status = 'Installing the AppMap agent...';

      await installer.installAgent();

      this.verifyProject(installer);

      const appMapYml = this.configPath;
      if (!useExistingAppMapYml) {
        const initCommand = await installer.initCommand();
        const { stdout } = await run(initCommand);
        const json = JSON.parse(stdout);

        fs.writeFileSync(appMapYml, json.configuration.contents);
      }

      await this.validateProject(installer, useExistingAppMapYml);

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
