/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */

import { promises as fsp } from 'fs';
import AgentInstaller from './agentInstallerBase';
import BuildToolInstaller from './buildToolInstallerBase';
import CommandStruct from './commandStruct';
import ValidationError from './validationError';
import { Step } from './workflow';

const POETRY_LOCK_FILE = 'poetry.lock';
const REQUIREMENTS_FILE = 'requirements.txt';

const REGEX_PKG_DEPENDENCY = /^\s*appmap\s*[=>~]+=.*$/m;
// include .dev0 so pip will allow prereleases
const PKG_DEPENDENCY = 'appmap>=1.1.0.dev0';

export class PoetryInstaller extends BuildToolInstaller {
  constructor(protected readonly path: string) {
    super(POETRY_LOCK_FILE, path);
  }

  get installStep1(): Step {
    const ret = new Step(this.assumptions, null);
    return ret;
  }

  get assumptions(): string {
    return `Your project contains a ${POETRY_LOCK_FILE}. Therefore, it looks like a poetry project.`;
  }

  get postInstallMessage(): string {
    return `

The AppMap Python package ("appmap") will be added to your project as a development dependency.`;
  }

  get verifyCommand(): CommandStruct {
    return new CommandStruct(
      'poetry',
      ['add', '--dev', '--allow-prereleases', 'appmap'],
      this.path
    );
  }

  get agentInitCommand(): CommandStruct {
    return new CommandStruct('poetry', ['run', 'appmap-agent-init'], this.path);
  }

  async install(): Promise<void> {
    return Promise.resolve();
  }
}

export class PipInstaller extends BuildToolInstaller {
  constructor(protected readonly path: string) {
    super(REQUIREMENTS_FILE, path);
  }

  get assumptions(): string {
    return `Your project contains a ${REQUIREMENTS_FILE}. Therefore, it looks like a pip project.
We  will add a dependency on the "appmap" package by updating ${REQUIREMENTS_FILE}.`;
  }

  get postInstallMessage(): string {
    return `The AppMap Python package ("appmap") has been added to your ${REQUIREMENTS_FILE}. You should open this file and check that
it looks clean and correct.
    
Once you've done that, we'll complete the installation of the AppMap package by running the following command
in your terminal:`;
  }

  get verifyCommand(): CommandStruct {
    return new CommandStruct(
      'pip',
      ['install', '-r', REQUIREMENTS_FILE],
      this.path
    );
  }

  async install(): Promise<void> {
    let requirements = (await fsp.readFile(super.buildFilePath)).toString();

    const pkgExists = requirements.search(REGEX_PKG_DEPENDENCY) !== -1;

    if (pkgExists) {
      // Replace the existing package declaration entirely.
      requirements = requirements.replace(REGEX_PKG_DEPENDENCY, PKG_DEPENDENCY);
    } else {
      // Insert a new package declaration.
      // eslint-disable-next-line prefer-template
      requirements = `${PKG_DEPENDENCY}\n` + requirements;
    }

    await fsp.writeFile(super.buildFilePath, requirements);
  }

  get agentInitCommand(): CommandStruct {
    return new CommandStruct('appmap-agent-init', [], this.path);
  }
}

export default class PythonAgentInstaller extends AgentInstaller {
  /**
   * @param {string} path
   */
  constructor(path) {
    const installers = [
      new PoetryInstaller(path),
      new PipInstaller(path),
    ].filter((installer) => installer.available);
    if (installers.length === 0) {
      throw new ValidationError(
        'No Python installer available for the current project. Supported frameworks are: poetry, pip.'
      );
    }

    super(installers[0], path);
  }
}
