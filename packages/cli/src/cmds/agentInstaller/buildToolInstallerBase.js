// @ts-check

const { existsSync } = require('fs');
const { join } = require('path');
const { ManualStep } = require('./workflow');
const runCommand = require('./runCommand');

/**
 * @typedef {import('./types').Command} Command
 * @typedef {import('./types').InstallResult} InstallResult
 */
class BuildToolInstallerBase {
  /**
   * @param {string} buildFile
   * @param {string} path
   *
   */
  constructor(buildFile, path) {
    this.buildFile = buildFile;
    this.path = path;
  }

  get installSteps() {
    return [this.installStep1, this.installStep2];
  }

  get installStep1() {
    const prompt = `${this.assumptions}\n`;
    return new ManualStep(prompt, async (userAction) => {
      if (userAction !== 'm') {
        await this.installCommand();
      }
    });
  }

  get installStep2() {
    const cmd = [
      '  ',
      this.verifyCommand.program,
      this.verifyCommand.args.join(' '),
    ].join(' ');

    const prompt = `
${this.postInstallMessage}
${cmd}
`;
    return new ManualStep(prompt, async (userAction) => {
      if (userAction !== 'm') {
        await runCommand(this.verifyCommand);
      }
    });
  }

  get available() {
    return existsSync(this.buildFilePath);
  }

  /**
   * @returns {string}
   */
  get buildFilePath() {
    return join(this.path, this.buildFile);
  }

  get installCommand() {
    return () => this.install();
  }

  // This is dumb: it's silly to have to declare these like this here just to
  // keep the ts checker happy. There doesn't appear to be an alternative that
  // avoids mucking with all the subclasses....
  /**
   * @returns {Command}
   */
  // eslint-disable-next-line class-methods-use-this
  get agentInitCommand() {
    throw new Error('not implemented');
  }

  /**
   * @returns {string}
   */
  // eslint-disable-next-line class-methods-use-this
  get assumptions() {
    throw new Error('not implemented');
  }

  /**
   * @returns {string}
   */
  // eslint-disable-next-line class-methods-use-this
  get postInstallMessage() {
    throw new Error('not implemented');
  }

  /**
   * @returns {Command}
   */
  // eslint-disable-next-line class-methods-use-this
  get verifyCommand() {
    throw new Error('not implemented');
  }

  /**
   * @returns {Promise<InstallResult>}
   */
  // eslint-disable-next-line class-methods-use-this
  async install() {
    throw new Error('not implemented');
  }
}

module.exports = BuildToolInstallerBase;
