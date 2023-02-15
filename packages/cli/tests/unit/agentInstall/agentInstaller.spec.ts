import path from 'path';
import AgentInstaller from '../../../src/cmds/agentInstaller/agentInstaller';
import commandStruct from '@appland/common/src/commandStruct';

class FakeInstaller extends AgentInstaller {
  public buildFile: string = 'bf';
  public documentation: string = 'http://www.example.com';
  constructor(path: string) {
    super('Fake', path);
  }

  get language(): string {
    return 'Method not implemented';
  }
  get appmap_dir(): string {
    return 'Method not implemented';
  }
  installAgent(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  checkConfigCommand(): Promise<commandStruct | undefined> {
    throw new Error('Method not implemented.');
  }
  checkCurrentConfig(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  validateAgentCommand(): Promise<commandStruct> {
    throw new Error('Method not implemented.');
  }
  initCommand(): Promise<commandStruct> {
    throw new Error('Method not implemented.');
  }
  verifyCommand(): Promise<commandStruct> {
    throw new Error('Method not implemented.');
  }
  environment(): Promise<Record<string, string>> {
    throw new Error('Method not implemented.');
  }
  available(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}

describe('agentInstaller', () => {
  it('resolves the path', () => {
    const installer = new FakeInstaller('.');

    expect(path.isAbsolute(installer.path)).toBeTruthy();
  });
});
