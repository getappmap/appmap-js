import chalk from 'chalk';
import fs from 'fs';
import { join, resolve } from 'path';
import yaml from 'js-yaml';
import Yargs from 'yargs';

import AgentInstaller from './agentInstaller';
import { AbortError, InstallError, ValidationError } from '../errors';
import { run } from './commandRunner';
import UI from '../userInteraction';
import {validateConfig} from '../../service/config/validator';

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
          `Change the current directory or specify a different directory as the last argument to this command.`,
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
          Object.entries(env)
            .filter(([_, value]) => Boolean(value))
            .map(([key, value]) => `  ${chalk.blue(key)}: ${value.trim()}`),
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
          writeAppMapYml = false;
        }
      }

      UI.status = 'Installing the AppMap agent...';

      await installer.installAgent();

      if (installer.verifyCommand) {
        const cmd = await installer.verifyCommand();
        await run(cmd);
      }

      const appMapYml = this.configPath;
      if (writeAppMapYml) {
        const initCommand = await installer.initCommand();
        const { stdout } = await run(initCommand);
        const json = JSON.parse(stdout);

        fs.writeFileSync(
          appMapYml,
          json.configuration.contents
        );
      }

      if (installer.validateAgentCommand) {
        UI.status = 'Validating the AppMap agent...';

        let {stdout} = await this.validateAgent(await installer.validateAgentCommand());
        const schema = JSON.parse(stdout)['schema'];
        // If appmap-agent-validate returned a schema, and we're using an
        // existing appmap.yml, verify that the config matches the schema.
        if (schema && !writeAppMapYml) {
          UI.status = `Checking the syntax of AppMap agent configuration...`;
          const config = this.loadConfig();
          const result = validateConfig(schema, config);
          if (!result.valid) {
            const errors = result.errors!
            const lines = errors.cli.split('\n').slice(2,4);

            // type in IOutputError is wrong, says the member is called dataPath?
            lines[1] += ` (${errors.js[0]['path']})`;

            throw new ValidationError(`\n${appMapYml}:\n${lines.join('\n')}`);
          }
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

  loadConfig() {
    return yaml.load(fs.readFileSync(this.configPath));
  }

  async validateAgent(cmd) {
    let stdout, stderr;
    try {
      return run(cmd);
    } catch (e) {
      UI.error('Failed to validate the installation.');
      throw e;
    }
  }

   
  get configExists(): boolean {
    return fs.existsSync(this.configPath);
  }

  get configPath(): fs.PathLike {
    return resolve(join(this.path, 'appmap.yml'));
  }
}
