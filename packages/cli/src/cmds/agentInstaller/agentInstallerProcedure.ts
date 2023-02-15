import chalk from 'chalk';
import fs from 'fs';
import Yargs from 'yargs';

import { AbortError } from '@appland/common/src/errors';
import { run } from '@appland/common/src/commandRunner';
import UI from '../userInteraction';
import AgentProcedure from './agentProcedure';
import Telemetry from '@appland/common/src/telemetry';
import CommandStruct from '@appland/common/src/commandStruct';
import { formatValidationError } from './ValidationResult';
import { GitStatus } from './types/state';
import { dump, load } from 'js-yaml';
import { readFile } from 'fs/promises';

export default class AgentInstallerProcedure extends AgentProcedure {
  async run(): Promise<void> {
    const { confirm } = await UI.prompt({
      type: 'confirm',
      name: 'confirm',
      message: [
        `AppMap is about to be installed. Confirm the details below.`,
        await this.getEnvironmentForDisplay(),
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
      throw new AbortError('aborted while confirming installation environment');
    }

    let useExistingAppMapYml = false;
    let existingConfig: any;
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
        try {
          existingConfig = this.loadConfig();
          useExistingAppMapYml = true;
        } catch {
          throw new AbortError(
            'An appmap.yml file exists but is not valid. Please remove it or fix it and try again.'
          );
        }
      }
    }

    UI.status = 'Installing AppMap...';

    try {
      const filesBeforeGitStatus: GitStatus[] = await this.gitStatus();
      const filesBefore: string[] = [];
      for (const file of filesBeforeGitStatus) {
        filesBefore.push(file.file);
      }
      await this.installer.checkCurrentConfig();
      await this.installer.installAgent();

      await this.verifyProject();

      if (!useExistingAppMapYml) {
        const initCommand = await this.installer.initCommand();
        const { stdout } = await run(initCommand);
        const initCommandOutput = JSON.parse(stdout);
        const recommendedConfig = (load(initCommandOutput.configuration.contents) as any) || {};

        recommendedConfig.language = this.installer.language;
        recommendedConfig.appmap_dir = this.installer.appmap_dir;

        this.writeConfigFile(recommendedConfig);
      } else {
        let dirty = false;
        const updateField = (fieldName: string): void => {
          if (!existingConfig[fieldName]) {
            UI.success(`Updating ${fieldName} in appmap.yml`);
            existingConfig[fieldName] = this.installer[fieldName];
            dirty = true;
          }
        };
        ['language', 'appmap_dir'].forEach(updateField);
        if (dirty) {
          this.writeConfigFile(existingConfig);
        }
      }

      const result = await this.validateProject(useExistingAppMapYml);

      await this.commitConfiguration(filesBefore);

      const successMessage = [
        chalk.green('Success! AppMap has finished installing.'),
        '',
        chalk.blue('NEXT STEP: Record AppMaps'),
        '',
        'You can consult the AppMap documentation, or continue with the ',
        'instructions provided in the AppMap code editor extension.',
      ];

      UI.success(successMessage.join('\n'));

      if (result?.errors)
        for (const warning of result.errors.filter((e) => e.level === 'warning'))
          UI.warn(formatValidationError(warning));
    } catch (e) {
      const error = e as Error;
      console.log(error?.message);
      if (this.installer.name === 'Bundler') {
        if (error?.message.includes('but is an incompatible architecture')) {
          await run(new CommandStruct('gem', ['uninstall', 'appmap', '-x', '--force'], this.path));

          const incompatibleArchitectureMessage = [
            '\n',
            chalk.bold.red('AppMap Installation Error!'),
            '',
            'Please run the following command in your terminal, then re-run the installer:',
            '',
            chalk.blue('bundle'),
            '\n',
          ];

          Telemetry.sendEvent({
            name: 'install-agent:architecture-mismatch-error',
            properties: {
              error: error?.message,
              directory: this.path,
              installer: this.installer.name,
            },
          });

          UI.error(incompatibleArchitectureMessage.join('\n'));
        } else if (error?.message.includes('without the test and development groups')) {
          const bundlerConfigErrorMessage = [
            '\n',
            chalk.bold.red('AppMap Installation Error!'),
            '',
            'Please ensure that bundler installs either the development group,',
            'the test group, or both. We suggest running the following command',
            'in your terminal and then re-running the installer:',
            '',
            chalk.blue('bundle install --with development'),
            '\n',
            'For more information, see the bundler docs: ' +
              'https://bundler.io/man/bundle-install.1.html',
            '',
          ];

          Telemetry.sendEvent({
            name: 'install-agent:bundler-config-error',
            properties: {
              error: error?.message,
              directory: this.path,
              installer: this.installer.name,
            },
          });

          UI.error(bundlerConfigErrorMessage.join('\n'));
        } else {
          throw e;
        }
      } else {
        throw e;
      }
    }
  }

  writeConfigFile(config: Record<string, any>) {
    fs.writeFileSync(this.configPath, dump(config));
  }
}
