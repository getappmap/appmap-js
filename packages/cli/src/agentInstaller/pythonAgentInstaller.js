/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
// @ts-check

const { promises: fsp } = require('fs');
const childProcess = require('child_process');
const BuildToolInstaller = require('./buildToolInstallerBase');
const CommandStruct = require('./commandStruct');
const InstallAgentStep = require('./installAgentStep');
const ValidationError = require('../errors/validationError');

/**
 * @typedef {import('./types').AgentInstaller} AgentInstaller
 * @typedef {import('./types').Command} Command
 * @typedef {import('./types').InstallResult} InstallResult
 * @typedef {import('./types').InstallStep} InstallStep
 */

const POETRY_LOCK_FILE = 'poetry.lock';
const REQUIREMENTS_FILE = 'requirements.txt';

const REGEX_PKG_DEPENDENCY = /^\s*appmap\s*[=>~]+=.*$/m;
// include .dev0 so pip will allow prereleases
const PKG_DEPENDENCY = 'appmap>=1.1.0.dev0';

class PoetryInstaller extends BuildToolInstaller {
  /**
   * @param {string} path
   */
  constructor(path) {
    super(POETRY_LOCK_FILE, path);
  }

  /**
   * @returns {string}
   */
  get assumptions() {
    return `Your project contains a ${POETRY_LOCK_FILE}. Therefore, it looks like a poetry project,
so we will install the AppMap Python package "appmap".`;
  }

  /**
   * @returns {string}
   */
  get postInstallMessage() {
    return `The AppMap Python package ("appmap") has been added to your pyproject.toml as a development dependency. You should open this file and check that
it looks clean and correct.`;
  }

  /**
   * @returns {Command}
   */
  get verifyCommand() {
    return null;
  }

  /**
   * @returns {Promise<InstallResult>}
   */
  async install(spawn = childProcess.spawn) {
    spawn('poetry', ['add', '--dev', '--allow-prereleases', 'appmap']);
    return 'installed';
  }
}

class PipInstaller extends BuildToolInstaller {
  /**
   * @param {string} path
   */
  constructor(path) {
    super(REQUIREMENTS_FILE, path);
  }

  /**
   * @returns {string}
   */
  get assumptions() {
    return `Your project contains a ${REQUIREMENTS_FILE}. Therefore, it looks like a pip project,
    so we will add a dependency on the "appmap" package.`;
  }

  /**
   * @returns {string}
   */
  get postInstallMessage() {
    return `The AppMap Python package ("appmap") has been added to your ${REQUIREMENTS_FILE}. You should open this file and check that
    it looks clean and correct.`;
  }

  /**
   * @returns {Command}
   */
  get verifyCommand() {
    return new CommandStruct(
      'pip',
      ['install', '-r', REQUIREMENTS_FILE],
      process.env
    );
  }

  /**
   * @returns {Promise<InstallResult>}
   */
  async install() {
    let requirements = (await fsp.readFile(this.buildFilePath)).toString();

    const pkgExists = requirements.search(REGEX_PKG_DEPENDENCY) !== -1;

    if (pkgExists) {
      // Replace the existing package declaration entirely.
      requirements = requirements.replace(REGEX_PKG_DEPENDENCY, PKG_DEPENDENCY);
    } else {
      // Insert a new package declaration.
      // eslint-disable-next-line prefer-template
      requirements = `${PKG_DEPENDENCY}\n` + requirements;
    }

    await fsp.writeFile(this.buildFilePath, requirements);

    return 'installed';
  }
}

class PythonAgentInstaller {
  /**
   * @param {string} path
   */
  constructor(path) {
    this.path = path;
  }

  /**
   *
   * @returns {InstallStep[]}
   */
  installAgent() {
    const installers = [
      new PoetryInstaller(this.path),
      new PipInstaller(this.path),
    ].filter((installer) => installer.available);
    if (installers.length > 0) {
      return [new InstallAgentStep(installers[0])];
    }

    throw new ValidationError(
      'No Python installer available for the current project. Supported frameworks are: poetry, pip.'
    );
  }

  /**
   * @returns {InstallStep[]}
   */
  configureAgent() {
    return [];
  }

  /**
   * @returns {InstallStep[]}
   */
  runTests() {
    return [];
  }
}

module.exports = {
  PythonAgentInstaller,
  PoetryInstaller,
  PipInstaller,
};
