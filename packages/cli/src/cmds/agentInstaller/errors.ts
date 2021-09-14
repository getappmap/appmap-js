import AgentInstaller from './agentInstaller';

export class InstallError {
  constructor(readonly error: unknown, readonly installer?: AgentInstaller) {}
}

export class AbortError extends Error {}
export class ValidationError extends Error {}
