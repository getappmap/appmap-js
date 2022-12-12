import AgentInstaller from '../../../src/cmds/agentInstaller/agentInstaller';
import AgentProcedure from '../../../src/cmds/agentInstaller/agentProcedure';
import commandStruct from '../../../src/cmds/agentInstaller/commandStruct';

export class TestAgentProcedure extends AgentProcedure {
  constructor() {
    const installer = new TestAgentInstaller();
    super(installer, '/test/agent/procedure/path');
  }
}

export class TestAgentInstaller extends AgentInstaller {
  constructor() {
    super('test agent', '/test/agent/installer/path');
  }

  public buildFile = 'test build file';
  public documentation = 'test documentation';

  get language(): string {
    return 'pig-latin';
  }
  get appmap_dir(): string {
    return 'tmp/appmap';
  }

  async validateAgentCommand(): Promise<commandStruct | undefined> {
    return new commandStruct('test validate agent command', [], '/test/validate/agent/command');
  }

  async installAgent(): Promise<void> {}

  async checkConfigCommand(): Promise<commandStruct | undefined> {
    return undefined;
  }

  async initCommand(): Promise<commandStruct> {
    return new commandStruct('test init agent command', [], '/test/validate/init/command');
  }

  async verifyCommand(): Promise<commandStruct | undefined> {
    return undefined;
  }

  async environment(): Promise<Record<string, string>> {
    return { test: 'environment' };
  }

  available(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}
