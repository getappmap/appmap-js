const { existsSync, writeFileSync } = require('fs');
const os = require('os');
const { join } = require('path');
const { ManualStep, Step } = require('./workflow');
const cmdRunner = require('./commandRunner');
const ValidationError = require('./validationError');

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
  constructor(buildFile, path, commandRunner = null) {
    this.buildFile = buildFile;
    this.path = path;
    this.commandRunner = commandRunner || cmdRunner;
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
        await this.commandRunner.run(this.verifyCommand);
      }
    });
  }

  get configureSteps() {
    return [this.configureStep1, this.configureStep2];
  }

  get appMapYml() {
    const out = this.commandRunner.runSync(this.agentInitCommand);
    const json = JSON.parse(out);
    return json.configuration.contents;
  }

  get configureStep1() {
    const prompt = `
This is the AppMap configuration for this project:
${this.appMapYml}`;

    return new Step(prompt, null);
  }

  get configureStep2() {
    const configExists = existsSync(join(this.path, 'appmap.yml'));
    let prompt;
    let query;
    if (configExists) {
      prompt = `
appmap.yml exists.
`;
      query =
        "Hit enter to use the existing file, 'o' to overwrite, 'm' to update manually, 'a' to abort: ";
    } else {
      prompt = `
appmap.yml not found.
`;
      query = "Hit enter to create, 'm' to create manually, 'a' to abort: ";
    }
    return new Step(
      prompt,
      async (userAction) => {
        if (userAction === 'm') {
          return;
        }
        // userAction === 'a' gets caught by Step

        // Only remaining possibilities are the user hit enter, or the user
        // picked 'o'. If the user hit enter, create the config file only if it
        // doesn't already exit. If the user hit 'o', we want to overwrite the
        // file.
        if (!configExists || userAction === 'o') {
          writeFileSync('appmap.yml', this.appMapYml);
        }
      },
      query
    );
  }

  get validateSteps() {
    return [this.validateStep1];
  }

  get validateStep1() {
    const now = new Date();
    const resultsFile = join(
      os.tmpdir(),
      `agent-validation-${now.getFullYear()}${now.getMonth()}${now.getDay()}${now.getHours()}${now.getMinutes()}${now.getSeconds()}.log`
    );
    const prompt = `
We'll now ensure that your project is ready to create AppMaps.
Validation results will be available in
${resultsFile}
`;
    return new Step(
      prompt,
      async () =>
        new Promise((resolve, reject) => {
          const results = JSON.parse(
            this.commandRunner.runSync(this.agentValidateCommand)
          );
          if (results.length === 0) {
            const msg = `
Validation succeeded.

Your project is ready to go!
`;
            this.commandRunner.logger.log(msg);
            writeFileSync(resultsFile, msg);
            resolve(0);
            return;
          }

          results.forEach((r) => {
            let msg = `
Error: ${r.message}`;
            this.commandRunner.logger.error(msg);
            writeFileSync(resultsFile, msg);
            if (r.detailed_message) {
              msg = `Detail: ${r.detailed_message};
`;
              this.commandRunner.logger.error(msg);
              writeFileSync(resultsFile, msg);
            }
          });
          reject(new ValidationError('Validation failed'));
        })
    );
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
   * @returns {Command}
   */
  // eslint-disable-next-line class-methods-use-this
  get agentValidateCommand() {
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
