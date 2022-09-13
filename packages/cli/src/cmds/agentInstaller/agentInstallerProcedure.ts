import chalk from 'chalk';
import fs from 'fs';
import Yargs from 'yargs';

import { AbortError } from '../errors';
import { run } from './commandRunner';
import UI from '../userInteraction';
import AgentProcedure from './agentProcedure';

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

    await this.installer.checkCurrentConfig();
    await this.installer.installAgent();

    await this.verifyProject();

    const appMapYml = this.configPath;
    if (!useExistingAppMapYml) {
      const initCommand = await this.installer.initCommand();
      const { stdout } = await run(initCommand);
      const json = JSON.parse(stdout);

      fs.writeFileSync(appMapYml, json.configuration.contents);
    }

    await this.validateProject(useExistingAppMapYml);

    const successMessage = [
      chalk.green('Success! The AppMap agent has been installed.'),
      '',
      chalk.blue('NEXT STEP: Record AppMaps'),
      '',
      'You can consult the AppMap documentation, or continue with the ',
      'instructions provided in the AppMap code editor extension.',
    ];

    UI.success(successMessage.join('\n'));
  }
}
