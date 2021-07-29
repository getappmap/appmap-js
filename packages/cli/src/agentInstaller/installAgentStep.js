// @ts-check

// eslint-disable-next-line no-unused-vars

class InstallAgentStep {
  /**
   * @param {import('./types').BuildToolInstaller} installer
   */
  constructor(installer) {
    this.buildToolInstaller = installer;
  }

  get assumptions() {
    return this.buildToolInstaller.assumptions;
  }

  get installCommand() {
    return () => this.buildToolInstaller.install();
  }

  get postInstallMessage() {
    return this.buildToolInstaller.postInstallMessage;
  }

  get verifyCommand() {
    return this.buildToolInstaller.verifyCommand;
  }
}

module.exports = InstallAgentStep;
