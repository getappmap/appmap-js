import CommandStruct from './commandStruct';

export default interface AgentInstaller {
  readonly path: string;
  readonly name: string;
  readonly buildFile?: string;

  installAgent(): Promise<void>;
  validateAgentCommand?(): Promise<CommandStruct>;
  initCommand(): Promise<CommandStruct>;
  verifyCommand?(): Promise<CommandStruct>;
  postInstallMessage?(): Promise<string>;
  environment?(): Promise<Record<string, string>>;
  available(): Promise<boolean>;
}
