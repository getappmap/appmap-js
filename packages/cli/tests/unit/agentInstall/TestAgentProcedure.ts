import AgentInstaller from '../../../src/cmds/agentInstaller/agentInstaller';
import AgentProcedure from '../../../src/cmds/agentInstaller/agentProcedure';
import commandStruct from '../../../src/cmds/agentInstaller/commandStruct';

export class TestAgentProcedure extends AgentProcedure {
  constructor() {
    const installer = new TestAgentInstaller();
    super(installer, '/test/agent/procedure/path');
  }
}

class TestAgentInstaller extends AgentInstaller {
  constructor() {
    super('test agent', '/test/agent/installer/path');
  }

  public buildFile = 'test build file';
  public documentation = 'test documentation';

  async validateAgentCommand(): Promise<commandStruct | undefined> {
    return new commandStruct('test validate agent command', [], '/test/validate/agent/command');
  }

  installAgent(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  checkConfigCommand(): Promise<commandStruct | undefined> {
    throw new Error('Method not implemented.');
  }
  initCommand(): Promise<commandStruct> {
    throw new Error('Method not implemented.');
  }
  verifyCommand(): Promise<commandStruct | undefined> {
    throw new Error('Method not implemented.');
  }
  environment(): Promise<Record<string, string>> {
    throw new Error('Method not implemented.');
  }
  available(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}
