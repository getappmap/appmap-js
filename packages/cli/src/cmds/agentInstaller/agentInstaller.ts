import { resolve } from 'path';
import { UserConfigError } from '@appland/common/src/errors';
import { run } from  '@appland/common/src/commandRunner';
import CommandStruct from '@appland/common/src/commandStruct';

export default abstract class AgentInstaller {
  public abstract buildFile: string;
  public abstract documentation: string;

  public path: string;

  constructor(readonly name: string, path: string) {
    this.path = resolve(path);
  }

  abstract get language(): string;
  abstract get appmap_dir(): string;
  abstract installAgent(): Promise<void>;

  abstract checkConfigCommand(): Promise<CommandStruct | undefined>;
  async checkCurrentConfig(): Promise<void> {
    const cmd = await this.checkConfigCommand();
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
