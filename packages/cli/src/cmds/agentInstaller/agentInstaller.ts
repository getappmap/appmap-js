import CommandStruct from './commandStruct';

export default interface AgentInstaller {
  readonly path: string;
  readonly name: string;
  readonly buildFile?: string;
  readonly documentation?: string;

  // If true, this installer will be considered only if no other installer is available.
  readonly fallback?: boolean;

  installAgent(): Promise<void>;
  validateAgentCommand?(): Promise<CommandStruct>;
  initCommand(): Promise<CommandStruct>;
  verifyCommand?(): Promise<CommandStruct>;
  postInstallMessage?(): Promise<string>;
  environment?(): Promise<Record<string, string>>;
  available(): Promise<boolean>;
}
