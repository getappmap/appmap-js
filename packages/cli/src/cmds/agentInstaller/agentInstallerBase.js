const { Workflow } = require('./workflow');

class AgentInstallerBase {
  constructor(buildToolInstaller, path) {
    this.buildToolInstaller = buildToolInstaller;
    this.path = path;
  }

  get installAgentFlow() {
    const btInstaller = this.buildToolInstaller;
    return new Workflow(btInstaller, btInstaller.installSteps, this.path);
  }

  get configureAgentFlow() {
    const btInstaller = this.buildToolInstaller;
    return new Workflow(btInstaller, btInstaller.configureSteps, this.path);
  }

  get validateAgentFlow() {
    const btInstaller = this.buildToolInstaller;
    return new Workflow(btInstaller, btInstaller.validateSteps, this.path);
  }
  /*
  runTests( {
    // TODO
    return null;
  }
  */
}

module.exports = AgentInstallerBase;
