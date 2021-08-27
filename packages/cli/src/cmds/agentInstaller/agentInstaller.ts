import CommandStruct from './commandStruct';

export default interface AgentInstaller {
  readonly path: string;
  readonly name: string;
  readonly buildFile?: string;

  installAgent(): void | Promise<void>;
  initCommand(): CommandStruct | Promise<CommandStruct>;
  verifyCommand?(): CommandStruct | Promise<CommandStruct>;
  postInstallMessage?(): string | Promise<string>;
  available(): boolean | Promise<boolean>;
}
