import UI from '../userInteraction';
import chalk from 'chalk';
import { Answers } from 'inquirer';

export enum OverwriteOption {
  USE_EXISTING = 'Use existing',
  OVERWRITE = 'Overwrite',
  ABORT = 'Abort',
}

export interface InstallerOptions {
  overwriteAppMapConfig?: boolean;
  installerName?: string;
  buildFile?: string;
}

export default class InstallerUI {
  constructor(public interactive: boolean, public options: InstallerOptions) {}

  message(message: string) {
    console.log(message);
  }

  status(status: string) {
    UI.status = status;
  }

  success(message: string) {
    UI.success(message);
  }

  warn(message: string) {
    UI.warn(message);
  }

  error(message?: string) {
    UI.error(message);
  }

  async confirm(message: string): Promise<boolean> {
    if (!this.interactive) return true;

    const { confirm } = await UI.prompt({
      type: 'confirm',
      name: 'confirm',
      message: message,
    });
    return confirm;
  }

  async attemptUnsupportedProjectType(message: string): Promise<boolean> {
    if (this.interactive) return true;

    const { willContinue } = await UI.prompt([
      {
        type: 'confirm',
        name: 'willContinue',
        prefix: chalk.yellow('!'),
        message,
      },
    ]);
    return willContinue;
  }

  async chooseSubprojects(rootHasInstaller: boolean): Promise<boolean> {
    if (!this.interactive) return false;

    const { addSubprojects } = await UI.prompt({
      type: 'confirm',
      default: !rootHasInstaller,
      name: 'addSubprojects',
      message:
        'This directory contains sub-projects. Would you like to choose sub-projects for installation?',
    });
    return addSubprojects;
  }

  async selectSubprojects(projects: string[]): Promise<string[]> {
    if (!this.interactive) {
      console.warn(
        `The installer should not be prompting for sub-projects in non-interactive mode!`
      );
      return [];
    }

    const { selectedSubprojects } = await UI.prompt({
      type: 'checkbox',
      name: 'selectedSubprojects',
      message: 'Select the projects to install AppMap to.',
      choices: projects,
    });
    return selectedSubprojects;
  }

  async pythonBuildFile(defaultChoice: string, choices: string[]): Promise<string> {
    if (this.options.buildFile) return this.options.buildFile;

    if (!this.interactive)
      throw new Error(
        `Multiple build files are available in this project (${choices.join(
          ', '
        )}). Use the --build-file option to specify one of them.`
      );

    const { buildFile } = await UI.prompt([
      {
        type: 'list',
        name: 'buildFile',
        message: 'Please choose the requirements file used for development:',
        choices,
        default: defaultChoice,
      },
    ]);

    return buildFile;
  }

  async selectProject(
    message: string,
    name: string,
    availableInstallers: string[]
  ): Promise<string> {
    if (this.options.installerName) return this.options.installerName;

    if (!this.interactive)
      throw new Error(
        `Project can be configured with multiple different installers (${availableInstallers.join(
          ', '
        )}). Use the --installer-name option to specify one of them.`
      );

    const result = await UI.prompt({
      type: 'list',
      name,
      message: message,
      choices: availableInstallers,
    });
    return result[name];
  }

  async addMavenCentral(): Promise<boolean> {
    if (!this.interactive) return true;

    const { addMavenCentral } = await UI.prompt({
      type: 'list',
      name: 'addMavenCentral',
      message:
        'The Maven Central repository is required by the AppMap plugin to fetch the AppMap agent JAR. Add it now?',
      choices: ['Yes', 'No'],
    });
    return addMavenCentral === 'Yes';
  }

  async commitConfiguration(message: string): Promise<boolean> {
    if (!this.interactive) {
      console.warn(
        `The installer should not be trying to commit configuration in non-interactive mode!`
      );
      return false;
    }

    const { commit } = await UI.prompt({
      type: 'confirm',
      name: 'commit',
      message: message,
    });
    return commit;
  }

  async continueWithoutJavaPlugin(): Promise<boolean> {
    if (!this.interactive) return true;

    const { userWillContinue } = await UI.prompt({
      type: 'list',
      name: 'userWillContinue',
      message: `The ${chalk.red(
        "'java'"
      )} plugin was not found. This configuration is unsupported and is likely to fail. Continue?`,
      default: 'Abort',
      choices: ['Abort', 'Continue'],
    });

    return userWillContinue === 'Continue';
  }

  async overwriteAppMapConfig(): Promise<OverwriteOption> {
    if (this.options.overwriteAppMapConfig === true) return OverwriteOption.OVERWRITE;
    if (this.options.overwriteAppMapConfig === false) return OverwriteOption.USE_EXISTING;

    if (!this.interactive)
      throw new Error(
        `The project already contains an AppMap config file (e.g. appmap.yml). Use the --overwrite-appmap-config option to specify whether it should be overwritten.`
      );

    const { overwriteAppMapYml } = await UI.prompt({
      type: 'list',
      name: 'overwriteAppMapYml',
      message:
        'An appmap.yml configuration file already exists. How should the conflict be resolved?',

      choices: [OverwriteOption.USE_EXISTING, OverwriteOption.OVERWRITE, OverwriteOption.ABORT],
    });
    return overwriteAppMapYml;
  }

  async shouldShowError(message: string): Promise<boolean> {
    if (!this.interactive) return true;

    const { showError } = await UI.prompt(
      {
        name: 'showError',
        type: 'confirm',
        message,
        prefix: chalk.red('!'),
      },
      { supressSpinner: true }
    );
    return showError;
  }
}
