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

  /*
  runTests( {
    // TODO
    return null;
  }
  */
}

module.exports = AgentInstallerBase;
