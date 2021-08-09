/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
// @ts-check

const { promises: fsp } = require('fs');
const AgentInstaller = require('./agentInstallerBase');
const BuildToolInstaller = require('./buildToolInstallerBase');
const CommandStruct = require('./commandStruct');
const ValidationError = require('./validationError');

/**
 * @typedef {import('./types').Command} Command
 * @typedef {import('./types').InstallResult} InstallResult
 * @typedef {import('./types').InstallStep} InstallStep
 */

const REGEX_GEM_DECLARATION = /(?!\s)(?:gem|group|require)\s/m;
const REGEX_GEM_DEPENDENCY = /^\s*gem\s+['|"]appmap['|"].*$/m;
const GEM_DEPENDENCY = "gem 'appmap', :groups => [:development, :test]";

class BundleInstaller extends BuildToolInstaller {
  /**
   * @param {string} path
   */
  constructor(path) {
    super('Gemfile', path);
  }

  /**
   * @returns {string}
   */
  get assumptions() {
    return `Your project contains a Gemfile. Therefore, it looks like a Bundler project,
so we will install the AppMap Ruby gem, "appmap". This gem will be installed as close to the beginning
of your Gemfile as possible, so that AppMap can observe and hook the other gems as they load.`;
  }

  /**
   * @returns {string}
   */
  get postInstallMessage() {
    return `The AppMap Ruby gem ("appmap") has been added to your Gemfile. You should open this file and check that
it looks clean and correct.

Once you've done that, we'll complete the installation of the AppMap gem by running the following command
in your terminal:`;
  }

  /**
   * @returns {Command}
   */
  get verifyCommand() {
    return new CommandStruct('bundle', ['install'], {});
  }

  /**
   * @returns {Promise<InstallResult>}
   */
  async install() {
    let gemfile = (await fsp.readFile(this.buildFilePath)).toString();
    const index = gemfile.search(REGEX_GEM_DECLARATION);

    if (index !== -1) {
      const gemExists = gemfile.search(REGEX_GEM_DEPENDENCY) !== -1;

      if (gemExists) {
        // Replace the existing gem declaration entirely
        gemfile = gemfile.replace(REGEX_GEM_DEPENDENCY, `\n${GEM_DEPENDENCY}`);
      } else {
        // Insert a new gem declaration
        const chars = gemfile.split('');
        chars.splice(index, 0, `${GEM_DEPENDENCY}\n\n`);
        gemfile = chars.join('');
      }

      await fsp.writeFile(this.buildFilePath, gemfile);
    } else {
      await fsp.writeFile(
        this.buildFilePath,
        `${gemfile}\ngem "appmap", :groups => [:development, :test]\n`
      );
    }

    return 'installed';
  }

  get agentInitCommand() {
    return new CommandStruct('bundle', ['exec', 'appmap-agent-init'], {});
  }
}

class RubyAgentInstaller extends AgentInstaller {
  /**
   * @param {string} path
   */
  constructor(path) {
    const installers = [new BundleInstaller(path)].filter(
      (installer) => installer.available
    );
    if (installers.length === 0) {
      throw new ValidationError(
        'No Ruby installer available for the current project. Supported frameworks are: Bundler.'
      );
    }

    super(installers[0], path);
  }
}

module.exports = RubyAgentInstaller;
