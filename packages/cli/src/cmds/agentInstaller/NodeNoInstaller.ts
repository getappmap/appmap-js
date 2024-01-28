import { join } from 'node:path';

import { exists } from '../../utils';
import AgentInstaller from './agentInstaller';
import InstallerUI from './installerUI';

export default class NodeNoInstaller extends AgentInstaller {
  public readonly buildFile = 'package.json';
  public readonly documentation = 'https://appmap.io/docs/reference/appmap-node';
  public readonly language = 'javascript';
  public readonly appmap_dir = 'tmp/appmap';
  public readonly isNoop = true;

  constructor(path: string) {
    super('Node.js', path);
  }

  installAgent(ui: InstallerUI): void {
    ui.message('No AppMap installation needed for Node.js projects.');
    ui.message('You can use it directly by prepending `npx appmap-node` to your commands.');
    ui.message(`For more information, see ${this.documentation}`);
  }

  available(): Promise<boolean> {
    return exists(join(this.path, this.buildFile));
  }

  environment(): Record<string, string> {
    return { 'Node version': process.version };
  }

  checkConfigCommand(ui: InstallerUI) {}
  validateAgentCommand() {}
  initCommand() {}
  verifyCommand() {}
}
