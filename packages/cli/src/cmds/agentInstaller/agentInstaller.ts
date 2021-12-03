import { resolve } from 'path';
import CommandStruct from './commandStruct';

export default abstract class AgentInstaller {
  public abstract buildFile: string;
  public abstract documentation: string;

  public path: string;

  constructor(readonly name: string, path: string) {
    this.path = resolve(path);
  }

  abstract installAgent(): Promise<void>;
  abstract validateAgentCommand(): Promise<CommandStruct | undefined>;
  abstract initCommand(): Promise<CommandStruct>;
  abstract verifyCommand(): Promise<CommandStruct | undefined>;
  abstract postInstallMessage(): Promise<string>;
  abstract environment(): Promise<Record<string, string>>;
  abstract available(): Promise<boolean>;
}
