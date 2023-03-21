import { resolve } from 'path';
import { UserConfigError } from '../errors';
import { run } from './commandRunner';
import CommandStruct from './commandStruct';
import InstallerUI from './installerUI';

export default abstract class AgentInstaller {
  public abstract buildFile: string;
  public abstract documentation: string;

  public path: string;

  constructor(readonly name: string, path: string) {
    this.path = resolve(path);
  }

  abstract get language(): string;
  abstract get appmap_dir(): string;
  abstract installAgent(ui: InstallerUI): Promise<void>;

  abstract checkConfigCommand(ui: InstallerUI): Promise<CommandStruct | undefined>;
  async checkCurrentConfig(ui: InstallerUI): Promise<void> {
    const cmd = await this.checkConfigCommand(ui);
    if (!cmd) {
      return;
    }

    try {
      await run(cmd);
    } catch (err) {
      throw new UserConfigError(err as string);
    }
  }

  abstract validateAgentCommand(): Promise<CommandStruct | undefined>;
  abstract initCommand(): Promise<CommandStruct>;
  abstract verifyCommand(): Promise<CommandStruct | undefined>;
  abstract environment(): Promise<Record<string, string>>;
  abstract available(): Promise<boolean>;
}
